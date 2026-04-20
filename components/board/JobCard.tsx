'use client'

import { forwardRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Job } from '@/lib/types'

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export const JobCard = forwardRef<HTMLDivElement, JobCardProps>(
  ({ job, onEdit, onDelete, isDragging, style, ...props }, ref) => {
    const formattedDate = new Date(job.date_applied + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase()

    const accentColors: Record<string, string> = {
      applied: '#38bdf8', interviewing: '#a78bfa', offer: '#34d399', rejected: 'transparent',
    }
    const accentColor = accentColors[job.status]
    const isRejected = job.status === 'rejected'

    return (
      <div
        ref={ref}
        style={{
          ...style,
          background: 'rgba(15,23,42,0.9)',
          border: `1px solid ${isDragging ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.08)'}`,
          borderRadius: '8px',
          padding: '14px',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isRejected ? 0.5 : 1,
          transform: isDragging ? 'rotate(2deg) scale(1.02)' : undefined,
          boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.4)' : undefined,
          position: 'relative',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'border-color 0.15s, box-shadow 0.15s',
        }}
        className="group"
        {...props}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-sm font-bold leading-tight" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>{job.company}</div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(job) }} className="w-6 h-6 flex items-center justify-center rounded" style={{ border: '1px solid rgba(56,189,248,0.15)', background: 'rgba(56,189,248,0.05)', color: '#64748b' }}>
              <Pencil size={10} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(job.id) }} className="w-6 h-6 flex items-center justify-center rounded" style={{ border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: '#64748b' }}>
              <Trash2 size={10} />
            </button>
          </div>
        </div>
        <div className="text-xs mb-3" style={{ color: '#64748b', letterSpacing: '0.02em' }}>{job.role}</div>
        <div className="text-xs" style={{ color: '#334155', letterSpacing: '0.05em' }}>{formattedDate}</div>
        {job.notes && (
          <div className="mt-3 pt-3 text-xs leading-relaxed line-clamp-2" style={{ borderTop: '1px solid rgba(56,189,248,0.06)', color: '#475569', letterSpacing: '0.02em' }}>
            {job.notes}
          </div>
        )}
      </div>
    )
  }
)
JobCard.displayName = 'JobCard'
