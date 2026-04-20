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
    <div className="flex flex-col min-h-full">
      <div
        className="flex items-center justify-between pb-3 mb-3"
        style={{
          borderBottom: `1px solid ${isOver ? column.borderColor + '60' : column.borderColor + '30'}`,
          transition: 'border-color 0.15s',
        }}
      >
        <span
          className="text-xs font-bold tracking-widest"
          style={{ color: column.borderColor === 'transparent' ? '#475569' : column.borderColor }}
        >
          {column.label}
        </span>
        <span
          className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded"
          style={{
            background: column.borderColor === 'transparent'
              ? 'rgba(100,116,139,0.1)'
              : `${column.borderColor}18`,
            color: column.borderColor === 'transparent' ? '#475569' : column.borderColor,
          }}
        >
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 flex-1 min-h-16 rounded-lg transition-colors"
        style={{
          background: isOver ? 'rgba(56,189,248,0.03)' : 'transparent',
          padding: isOver ? '6px' : '0',
        }}
      >
        <SortableContext
          items={jobs.map(j => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map(job => (
            <SortableJobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex items-center justify-center gap-2 py-3 text-xs tracking-widest rounded-lg transition-colors"
        style={{
          border: '1px dashed rgba(56,189,248,0.12)',
          color: '#334155',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'
          e.currentTarget.style.color = '#38bdf8'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)'
          e.currentTarget.style.color = '#334155'
        }}
      >
        <Plus size={12} />
        ADD
      </button>
    </div>
  )
}
