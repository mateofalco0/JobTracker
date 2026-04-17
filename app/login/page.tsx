'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{ border: '1.5px solid #38bdf8', color: '#38bdf8', boxShadow: '0 0 12px rgba(56,189,248,0.15)' }}
          >
            JT
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-200">
            JOB<span style={{ color: '#38bdf8' }}>.</span>TRACKER
          </span>
        </div>

        <p className="text-xs tracking-widest text-slate-500 mb-1">// AUTHENTICATION</p>
        <h1 className="text-xl font-bold text-slate-100 mb-8">Welcome back</h1>

        {error && (
          <div
            className="mb-4 px-4 py-3 text-xs rounded-md"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 mb-4 text-xs tracking-widest font-semibold text-slate-300 rounded-md transition-colors disabled:opacity-50"
          style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          SIGN IN WITH GOOGLE
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
          <span className="text-xs text-slate-600">OR</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold tracking-widest rounded-md disabled:opacity-50"
            style={{ background: '#38bdf8', color: '#070b14' }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          No account?{' '}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
