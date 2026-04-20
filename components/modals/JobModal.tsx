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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-7 relative"
        style={{
          background: '#0f172a',
          border: '1px solid rgba(56,189,248,0.2)',
          boxShadow: '0 0 60px rgba(56,189,248,0.06), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: '15%', right: '15%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent)',
          }}
        />

        <div className="flex items-center justify-between mb-6">
          <span className="text-xs tracking-widest" style={{ color: '#38bdf8' }}>
            {job ? '// EDIT APPLICATION' : '// NEW APPLICATION'}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#475569', border: '1px solid rgba(56,189,248,0.1)' }}
          >
            <X size={12} />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 px-3 py-2 text-xs rounded"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
                COMPANY *
              </label>
              <input
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
                style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
                placeholder="Stripe"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
                STATUS
              </label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as JobStatus)}
                className="w-full px-3 py-2 text-xs rounded-md outline-none"
                style={{
                  background: 'rgba(7,11,20,0.8)',
                  border: '1px solid rgba(56,189,248,0.15)',
                  color: '#38bdf8',
                }}
              >
                {COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              ROLE *
            </label>
            <input
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              DATE APPLIED
            </label>
            <input
              type="date"
              value={form.date_applied}
              onChange={e => set('date_applied', e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
              style={{
                background: 'rgba(7,11,20,0.8)',
                border: '1px solid rgba(56,189,248,0.15)',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              NOTES (OPTIONAL)
            </label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={3}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none resize-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="Referral, recruiter name, interview details..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs tracking-widest rounded-md"
              style={{ border: '1px solid rgba(56,189,248,0.15)', color: '#64748b' }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-xs font-bold tracking-widest rounded-md disabled:opacity-50"
              style={{ background: '#38bdf8', color: '#070b14' }}
            >
              {saving ? 'SAVING...' : 'SAVE APPLICATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
