export interface Job {
  id: string
  user_id: string
  company: string
  role: string
  status: JobStatus
  date_applied: string
  notes: string | null
  position: number
  created_at: string
}

export type JobStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface Column {
  id: JobStatus
  label: string
  color: string
  textColor: string
}

export const COLUMNS: Column[] = [
  { id: 'applied',      label: 'Applied',      color: '#B8D4F0', textColor: '#1a3a5c' },
  { id: 'interviewing', label: 'Interviewing',  color: '#F5C896', textColor: '#5c3a0a' },
  { id: 'offer',        label: 'Offer',         color: '#A8E6C0', textColor: '#0a3a1f' },
  { id: 'rejected',     label: 'Rejected',      color: '#F0B8B8', textColor: '#5c1a1a' },
]

export type JobFormData = Pick<Job, 'company' | 'role' | 'status' | 'date_applied' | 'notes'>
