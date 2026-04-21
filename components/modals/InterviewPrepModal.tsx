'use client'

import { useEffect, useState } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { Job } from '@/lib/types'

interface Question {
  question: string
  hint: string
}

interface InterviewPrepModalProps {
  open: boolean
  job: Job | null
  onClose: () => void
}

export function InterviewPrepModal({ open, job, onClose }: InterviewPrepModalProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !job) return
    setQuestions([])
    setError(null)
    setLoading(true)

    fetch('/api/ai/interview-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: job.company, role: job.role }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setQuestions(data.questions ?? [])
      })
      .catch(err => setError(err.message ?? 'Failed to generate questions.'))
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
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col"
        style={{ background: '#1C1C1E' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3A3A3C' }} />
        </div>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} style={{ color: '#F5C896' }} />
            <h2 className="text-lg font-bold text-white">Interview Prep</h2>
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
                style={{ borderColor: '#F5C89633', borderTopColor: '#F5C896' }}
              />
              <span className="text-sm" style={{ color: '#8E8E93' }}>Generating questions…</span>
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

          {!loading && !error && questions.length > 0 && (
            <ol className="space-y-4">
              {questions.map((q, i) => (
                <li key={i} className="rounded-2xl p-4" style={{ background: '#2C2C2E' }}>
                  <div className="flex gap-3 mb-2">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: '#F5C896', color: '#5c3a0a' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-white leading-snug" style={{ paddingTop: '2px' }}>
                      {q.question}
                    </span>
                  </div>
                  <div className="ml-9 text-xs leading-relaxed" style={{ color: '#8E8E93' }}>
                    💡 {q.hint}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
