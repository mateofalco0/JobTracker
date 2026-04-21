'use client'

import { useEffect, useState } from 'react'
import { X, BarChart2 } from 'lucide-react'
import { Job } from '@/lib/types'

interface SummaryData {
  assessment: string
  goingWell: string
  improve: string
  nextSteps: string[]
}

interface AISummaryModalProps {
  open: boolean
  jobs: Job[]
  onClose: () => void
}

export function AISummaryModal({ open, jobs, onClose }: AISummaryModalProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSummary(null)
    setError(null)
    setLoading(true)

    fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setSummary(data)
      })
      .catch(err => setError(err.message ?? 'Failed to generate summary.'))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col"
        style={{ background: '#1C1C1E' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3A3A3C' }} />
        </div>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} style={{ color: '#A8E6C0' }} />
            <h2 className="text-lg font-bold text-white">AI Job Search Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ background: '#2C2C2E', color: '#8E8E93' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 pb-8 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span
                className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#A8E6C033', borderTopColor: '#A8E6C0' }}
              />
              <span className="text-sm" style={{ color: '#8E8E93' }}>Analyzing your job search…</span>
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

          {!loading && !error && summary && (
            <div className="space-y-4">
              {/* Overall Assessment */}
              <div className="rounded-2xl p-4" style={{ background: '#2C2C2E' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3B9EFF' }}>
                  Overall Assessment
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E5EA' }}>
                  {summary.assessment}
                </p>
              </div>

              {/* What's Going Well */}
              <div className="rounded-2xl p-4" style={{ background: '#2C2C2E' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#A8E6C0' }}>
                  What&apos;s Going Well
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E5EA' }}>
                  {summary.goingWell}
                </p>
              </div>

              {/* What to Improve */}
              <div className="rounded-2xl p-4" style={{ background: '#2C2C2E' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F5C896' }}>
                  Areas to Improve
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#E5E5EA' }}>
                  {summary.improve}
                </p>
              </div>

              {/* Next Steps */}
              <div className="rounded-2xl p-4" style={{ background: '#2C2C2E' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FF9F0A' }}>
                  3 Actionable Next Steps
                </div>
                <ol className="space-y-2.5">
                  {summary.nextSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: '#FF9F0A', color: '#fff' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed" style={{ color: '#E5E5EA', paddingTop: '2px' }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
