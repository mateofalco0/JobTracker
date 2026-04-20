'use client'

import { forwardRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Job, COLUMNS } from '@/lib/types'

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export const JobCard = forwardRef<HTMLDivElement, JobCardProps>(
  ({ job, onEdit, onDelete, isDragging, style, ...props }, ref) => {
    const [showActions, setShowActions] = useState(false)

    const column = COLUMNS.find(c => c.id === job.status)
    const accentColor = column?.color ?? '#2C2C2E'
    const accentText = column?.textColor ?? '#fff'

    const formattedDate = new Date(job.date_applied + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

    return (
      <div
        ref={ref}
        style={{
          ...style,
          background: '#1C1C1E',
          borderRadius: '16px',
          padding: '16px',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: isDragging ? 'rotate(2deg) scale(1.03)' : undefined,
          boxShadow: isDragging ? '0 20px 48px rgba(0,0,0,0.6)' : undefined,
          transition: isDragging ? 'none' : 'transform 0.15s',
          position: 'relative',
          overflow: 'hidden',
          opacity: isDragging ? 0.95 : 1,
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
        {...props}
      >
        {/* Status pill */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: accentColor, color: accentText }}
          >
            {column?.label}
          </span>
          {/* Action buttons — visible on hover/touch */}
          <div
            className="flex gap-1.5 transition-opacity"
            style={{ opacity: showActions ? 1 : 0 }}
          >
            <button
              onClick={e => { e.stopPropagation(); onEdit(job) }}
              className="w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              style={{ background: '#2C2C2E', color: '#8E8E93', minWidth: '28px', minHeight: '28px' }}
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(job.id) }}
              className="w-7 h-7 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              style={{ background: '#2C2C2E', color: '#FF453A', minWidth: '28px', minHeight: '28px' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Company + role */}
        <div className="text-base font-bold text-white leading-tight mb-1">{job.company}</div>
        <div className="text-sm mb-3" style={{ color: '#8E8E93' }}>{job.role}</div>

        {/* Date */}
        <div className="text-xs" style={{ color: '#636366' }}>{formattedDate}</div>

        {/* Notes preview */}
        {job.notes && (
          <div
            className="mt-3 pt-3 text-xs leading-relaxed line-clamp-2"
            style={{ borderTop: '1px solid #2C2C2E', color: '#636366' }}
          >
            {job.notes}
          </div>
        )}
      </div>
    )
  }
)
JobCard.displayName = 'JobCard'
