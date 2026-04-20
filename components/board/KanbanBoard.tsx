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
import { LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Job, JobFormData, JobStatus, COLUMNS } from '@/lib/types'
import { KanbanColumn } from './KanbanColumn'
import { JobCard } from './JobCard'
import { JobModal } from '../modals/JobModal'
import { StatsBar } from '../stats/StatsBar'
import { SearchBar } from '../ui/SearchBar'
import { FilterChips } from '../ui/FilterChips'

interface KanbanBoardProps {
  initialJobs: Job[]
  userEmail: string
}

type FilterValue = 'all' | 'active' | 'offers'

export function KanbanBoard({ initialJobs, userEmail }: KanbanBoardProps) {
  const supabase = createClient()

  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<JobStatus>('applied')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [activeJob, setActiveJob] = useState<Job | null>(null)

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
      const { error } = await supabase
        .from('jobs')
        .update({ ...data })
        .eq('id', editingJob.id)
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
        .insert({ ...data, position })
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
      setJobs(prev =>
        prev.map(j => j.id === activeId ? { ...j, status: newStatus } : j)
      )
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

    const columnJobs = jobs
      .filter(j => j.status === targetStatus)
      .sort((a, b) => a.position - b.position)

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
    <div className="flex flex-col min-h-screen">
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{
          borderBottom: '1px solid rgba(56,189,248,0.1)',
          background: 'rgba(7,11,20,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ border: '1.5px solid #38bdf8', color: '#38bdf8' }}
          >
            JT
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-200">
            JOB<span style={{ color: '#38bdf8' }}>.</span>TRACKER
          </span>
          <span
            className="flex items-center gap-1.5 text-xs ml-2"
            style={{ color: '#34d399' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#34d399', animation: 'pulse 2s infinite' }}
            />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterChips value={filter} onChange={setFilter} />
          <button
            onClick={() => openAddModal('applied')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest rounded-md"
            style={{ background: '#38bdf8', color: '#070b14' }}
          >
            <Plus size={12} />
            NEW APPLICATION
          </button>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold"
            title={`Sign out (${userEmail})`}
            style={{
              border: '1.5px solid rgba(56,189,248,0.25)',
              background: 'rgba(56,189,248,0.05)',
              color: '#64748b',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <StatsBar jobs={jobs} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4 p-6 flex-1">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              jobs={getColumnJobs(column.id)}
              onAdd={() => openAddModal(column.id)}
              onEdit={openEditModal}
              onDelete={handleDelete}
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

      <JobModal
        open={modalOpen}
        job={editingJob}
        defaultStatus={defaultStatus}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
