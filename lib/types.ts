export interface Job {
  id: string
  user_id: string
  company: string
  role: string
  status: JobStatus
  date_applied: string   // ISO date string: "2025-04-17"
  notes: string | null   // null means the user left it blank
  position: number       // order within the column
  created_at: string
}

export type JobStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface Column {
  id: JobStatus
  label: string
  accentColor: string
  borderColor: string
}

export const COLUMNS: Column[] = [
  { id: 'applied',      label: 'APPLIED',      accentColor: 'text-cyan-400',    borderColor: '#38bdf8' },
  { id: 'interviewing', label: 'INTERVIEWING',  accentColor: 'text-violet-400',  borderColor: '#a78bfa' },
  { id: 'offer',        label: 'OFFER',         accentColor: 'text-emerald-400', borderColor: '#34d399' },
  { id: 'rejected',     label: 'REJECTED',      accentColor: 'text-slate-500',   borderColor: 'transparent' },
]

// A partial Job used when creating/editing — no id/user_id/created_at yet
export type JobFormData = Pick<Job, 'company' | 'role' | 'status' | 'date_applied' | 'notes'>
