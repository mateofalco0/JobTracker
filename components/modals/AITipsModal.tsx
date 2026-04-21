'use client'

import { useEffect, useState } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { Job } from '@/lib/types'

interface AITipsModalProps {
  open: boolean
  job: Job | null
  onClose: () => void
}

export function AITipsModal({ open, job, onClose }: AITipsModalProps) {
  const [tips, setTips] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !job) return
    setTips([])
    setError(null)
    setLoading(true)

    fetch('/api/ai/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: job.company, role: job.role }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTips(data.tips ?? [])
      })
      .catch(err => setError(err.message ?? 'Failed to generate tips.'))
      .finally(() => setLoading(false))
  }, [open, job])

  if (!open || !job) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col"
        style={{ background: '#1C1C1E' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3A3A3C' }} />
        </div>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} style={{ color: '#FFD60A' }} />
            <h2 className="text-lg font-bold text-white">AI Tips</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ background: '#2C2C2E', color: '#8E8E93' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Job info */}
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="px-4 py-3 rounded-2xl" style={{ background: '#2C2C2E' }}>
            <div className="text-sm font-bold text-white">{job.company}</div>
            <div className="text-xs mt-0.5" style={{ color: '#8E8E93' }}>{job.role}</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span
                className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#3B9EFF33', borderTopColor: '#3B9EFF' }}
              />
              <span className="text-sm" style={{ color: '#8E8E93' }}>Generating tips…</span>
            </div>
          )}

          {error && (
            <div
              className="px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && tips.length > 0 && (
            <ol className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#3B9EFF', color: '#fff' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: '#E5E5EA', paddingTop: '2px' }}>
                    {tip}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
