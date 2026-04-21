'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

interface ParseJobModalProps {
  open: boolean
  onClose: () => void
  onFill: (company: string, role: string, notes: string) => void
}

export function ParseJobModal({ open, onClose, onFill }: ParseJobModalProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleExtract() {
    if (!description.trim()) {
      setError('Please paste a job description first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      onFill(data.company ?? '', data.role ?? '', data.notes ?? '')
      setDescription('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl"
        style={{ background: '#1C1C1E' }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: '#3A3A3C' }} />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#3B9EFF' }} />
            <h2 className="text-lg font-bold text-white">Paste job description</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ background: '#2C2C2E', color: '#8E8E93' }}
          >
            <X size={14} />
          </button>
        </div>

        {error && (
          <div
            className="mx-6 mb-3 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}
          >
            {error}
          </div>
        )}

        <div className="px-6 pb-8 space-y-3">
          <p className="text-sm" style={{ color: '#8E8E93' }}>
            Paste a raw job description and AI will extract the company, role, and a summary for you.
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={8}
            autoFocus
            style={{
              background: '#2C2C2E',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
              padding: '14px 16px',
              resize: 'none',
              lineHeight: '1.5',
            }}
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
              type="button"
              onClick={handleExtract}
              disabled={loading}
              className="flex-1 py-4 rounded-full text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
              style={{ background: '#3B9EFF', minHeight: '52px' }}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                  Extracting…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Extract
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
