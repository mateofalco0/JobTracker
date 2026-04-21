'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Job } from '@/lib/types'
import { JobCard } from './JobCard'

interface SortableJobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onAITips?: (job: Job) => void
  onInterviewPrep?: (job: Job) => void
}

export function SortableJobCard({ job, onEdit, onDelete, onAITips, onInterviewPrep }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <JobCard
      ref={setNodeRef}
      job={job}
      onEdit={onEdit}
      onDelete={onDelete}
      onAITips={onAITips}
      onInterviewPrep={onInterviewPrep}
      isDragging={false}
      style={style}
      {...attributes}
      {...listeners}
    />
  )
}
