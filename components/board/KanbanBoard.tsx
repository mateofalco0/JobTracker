'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, LogOut, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Job, JobFormData, JobStatus, COLUMNS } from '@/lib/types'
import { KanbanColumn } from './KanbanColumn'
import { JobCard } from './JobCard'
import { JobModal } from '../modals/JobModal'
import { AITipsModal } from '../modals/AITipsModal'
import { InterviewPrepModal } from '../modals/InterviewPrepModal'
import { AISummaryModal } from '../modals/AISummaryModal'
import { StatsBar } from '../stats/StatsBar'
import { SearchBar } from '../ui/SearchBar'
import { FilterChips } from '../ui/FilterChips'

interface KanbanBoardProps {
  initialJobs: Job[]
  userEmail: string
  userId: string
}

type FilterValue = 'all' | 'active' | 'offers'

export function KanbanBoard({ initialJobs, userEmail, userId }: KanbanBoardProps) {
  const supabase = createClient()

  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<JobStatus>('applied')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [aiTipsJob, setAITipsJob] = useState<Job | null>(null)
  const [interviewPrepJob, setInterviewPrepJob] = useState<Job | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      job.company.toLowerCase().includes(q) ||
      job.role.toLowerCase().includes(q)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && ['applied', 'interviewing'].includes(job.status)) ||
      (filter === 'offers' && job.status === 'offer')

    return matchesSearch && matchesFilter
  })

  function getColumnJobs(status: JobStatus): Job[] {
    return filteredJobs
      .filter(j => j.status === status)
      .sort((a, b) => a.position - b.position)
  }

  function openAddModal(status: JobStatus) {
    setEditingJob(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function openEditModal(job: Job) {
    setEditingJob(job)
    setModalOpen(true)
  }

  const handleSave = useCallback(async (data: JobFormData) => {
    if (editingJob) {
      const updated: Job = { ...editingJob, ...data }
      setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j))
      const { error } = await supabase.from('jobs').update({ ...data }).eq('id', editingJob.id)
      if (error) throw new Error(error.message)
    } else {
      const tempId = `temp-${Date.now()}`
      const position = jobs.filter(j => j.status === data.status).length
      const optimistic: Job = {
        id: tempId,
        user_id: '',
        created_at: new Date().toISOString(),
        position,
        ...data,
        notes: data.notes ?? null,
      }
      setJobs(prev => [...prev, optimistic])

      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert({ ...data, position, user_id: userId })
        .select()
        .single()

      if (error) {
        setJobs(prev => prev.filter(j => j.id !== tempId))
        throw new Error(error.message)
      }
      setJobs(prev => prev.map(j => j.id === tempId ? inserted : j))
    }
  }, [editingJob, jobs, supabase])

  const handleDelete = useCallback(async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) console.error('Delete failed:', error.message)
  }, [supabase])

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find(j => j.id === event.active.id)
    setActiveJob(job ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return
    const draggedJob = jobs.find(j => j.id === activeId)
    if (!draggedJob) return
    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const overJob = jobs.find(j => j.id === overId)
    const newStatus: JobStatus = isOverColumn
      ? (overId as JobStatus)
      : (overJob?.status ?? draggedJob.status)
    if (draggedJob.status !== newStatus) {
      setJobs(prev => prev.map(j => j.id === activeId ? { ...j, status: newStatus } : j))
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveJob(null)
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string
    const draggedJob = jobs.find(j => j.id === activeId)
    if (!draggedJob) return
    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const targetStatus: JobStatus = isOverColumn
      ? (overId as JobStatus)
      : (jobs.find(j => j.id === overId)?.status ?? draggedJob.status)
    // Explicitly apply targetStatus to the dragged job before computing column order,
    // guarding against a stale closure from before handleDragOver's setState resolved.
    const currentJobs = jobs.map(j => j.id === activeId ? { ...j, status: targetStatus } : j)
    const columnJobs = currentJobs.filter(j => j.status === targetStatus).sort((a, b) => a.position - b.position)
    const oldIndex = columnJobs.findIndex(j => j.id === activeId)
    const newIndex = isOverColumn
      ? columnJobs.length - 1
      : columnJobs.findIndex(j => j.id === overId)
    const reordered = arrayMove(columnJobs, oldIndex < 0 ? 0 : oldIndex, newIndex < 0 ? 0 : newIndex)
    const positionUpdates = reordered.map((j, i) => ({ ...j, position: i, status: targetStatus }))
    setJobs(prev => [...prev.filter(j => j.status !== targetStatus), ...positionUpdates])
    await Promise.all(
      positionUpdates.map(j =>
        supabase.from('jobs').update({ status: j.status, position: j.position }).eq('id', j.id)
      )
    )
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10 px-4 md:px-6"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
        {/* Top row: logo + sign out */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="JobTracker" className="w-8 h-8 flex-shrink-0" />
            <span className="text-base font-bold text-white">Job Tracker</span>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Summary button */}
            <button
              onClick={() => setSummaryOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: '#1C1C1E', color: '#A8E6C0', minHeight: '40px' }}
              title="AI Summary"
            >
              <BarChart2 size={14} />
              AI Summary
            </button>
            {/* Desktop: add button in header */}
            <button
              onClick={() => openAddModal('applied')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ background: '#3B9EFF', minHeight: '40px' }}
            >
              <Plus size={14} />
              New application
            </button>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              title={`Sign out (${userEmail})`}
              style={{ background: '#1C1C1E', color: '#8E8E93' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2 pb-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterChips value={filter} onChange={setFilter} />
        </div>
      </header>

      {/* ── Stats ── */}
      <StatsBar jobs={jobs} />

      {/* ── Board ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Mobile: vertical stack. Desktop: 4-column grid */}
        <div className="flex flex-col md:grid md:grid-cols-4 gap-4 p-4 md:p-6 flex-1 pb-28 md:pb-6">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              jobs={getColumnJobs(column.id)}
              onAdd={() => openAddModal(column.id)}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onAITips={setAITipsJob}
              onInterviewPrep={setInterviewPrepJob}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <JobCard
              job={activeJob}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Mobile FAB row ── */}
      <div className="fixed bottom-6 right-5 md:hidden z-20 flex items-center gap-3">
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center gap-2 px-4 py-4 rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          style={{ background: '#1C1C1E', color: '#A8E6C0', minHeight: '54px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          <BarChart2 size={16} />
        </button>
        <button
          onClick={() => openAddModal('applied')}
          className="flex items-center gap-2 px-5 py-4 rounded-full text-base font-semibold text-white shadow-lg active:scale-95 transition-transform"
          style={{ background: '#3B9EFF', minHeight: '54px', boxShadow: '0 8px 32px rgba(59,158,255,0.4)' }}
        >
          <Plus size={18} />
          New
        </button>
      </div>

      {/* ── Modals ── */}
      <JobModal
        open={modalOpen}
        job={editingJob}
        defaultStatus={defaultStatus}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <AITipsModal
        open={aiTipsJob !== null}
        job={aiTipsJob}
        onClose={() => setAITipsJob(null)}
      />
      <InterviewPrepModal
        open={interviewPrepJob !== null}
        job={interviewPrepJob}
        onClose={() => setInterviewPrepJob(null)}
      />
      <AISummaryModal
        open={summaryOpen}
        jobs={jobs}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  )
}
