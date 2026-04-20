'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Column, Job } from '@/lib/types'
import { SortableJobCard } from './SortableJobCard'

interface KanbanColumnProps {
  column: Column
  jobs: Job[]
  onAdd: () => void
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
}

export function KanbanColumn({ column, jobs, onAdd, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ background: column.color }}
          />
          <span className="text-sm font-semibold text-white">{column.label}</span>
        </div>
        <span
          className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
          style={{ background: '#2C2C2E', color: '#8E8E93' }}
        >
          {jobs.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 flex-1 rounded-2xl transition-colors"
        style={{
          minHeight: '80px',
          background: isOver ? 'rgba(255,255,255,0.04)' : 'transparent',
          padding: isOver ? '8px' : '0',
        }}
      >
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.length === 0 && !isOver ? (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10"
              style={{ background: '#111111' }}
            >
              <span className="text-2xl">📭</span>
              <span className="text-xs" style={{ color: '#636366' }}>Nothing here yet</span>
            </div>
          ) : (
            jobs.map(job => (
              <SortableJobCard
                key={job.id}
                job={job}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium active:scale-95 transition-all"
        style={{
          background: '#1C1C1E',
          color: '#8E8E93',
          minHeight: '44px',
        }}
      >
        <Plus size={14} />
        Add
      </button>
    </div>
  )
}
