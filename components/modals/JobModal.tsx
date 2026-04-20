'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Job, JobFormData, JobStatus, COLUMNS } from '@/lib/types'

interface JobModalProps {
  open: boolean
  job: Job | null
  defaultStatus?: JobStatus
  onSave: (data: JobFormData) => Promise<void>
  onClose: () => void
}

const emptyForm = (): JobFormData => ({
  company: '',
  role: '',
  status: 'applied',
  date_applied: new Date().toISOString().split('T')[0],
  notes: null,
})

const inputStyle: React.CSSProperties = {
  background: '#2C2C2E',
  borderRadius: '12px',
  color: '#FFFFFF',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  padding: '14px 16px',
  minHeight: '48px',
}

export function JobModal({ open, job, defaultStatus, onSave, onClose }: JobModalProps) {
  const [form, setForm] = useState<JobFormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (job) {
      setForm({
        company: job.company,
        role: job.role,
        status: job.status,
        date_applied: job.date_applied,
        notes: job.notes,
      })
    } else {
      setForm({ ...emptyForm(), status: defaultStatus ?? 'applied' })
    }
    setError(null)
  }, [job, defaultStatus, open])

  if (!open) return null

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, notes: form.notes?.trim() || null })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet: full-screen on mobile, centered popup on sm+ */}
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl"
        style={{ background: '#1C1C1E' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3A3A3C' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {job ? 'Edit application' : 'New application'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ background: '#2C2C2E', color: '#8E8E93' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mx-6 mb-3 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-3">
          <input
            value={form.company}
            onChange={e => set('company', e.target.value)}
            placeholder="Company"
            style={inputStyle}
            autoFocus
          />
          <input
            value={form.role}
            onChange={e => set('role', e.target.value)}
            placeholder="Role"
            style={inputStyle}
          />

          <select
            value={form.status}
            onChange={e => set('status', e.target.value as JobStatus)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          >
            {COLUMNS.map(col => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={form.date_applied}
            onChange={e => set('date_applied', e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />

          <textarea
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value || null)}
            placeholder="Notes (optional)"
            rows={3}
            style={{ ...inputStyle, minHeight: '80px', resize: 'none', lineHeight: '1.5' }}
          />

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-full text-sm font-semibold active:scale-95 transition-transform"
              style={{ background: '#2C2C2E', color: '#8E8E93', minHeight: '52px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 rounded-full text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform"
              style={{ background: '#3B9EFF', minHeight: '52px' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
