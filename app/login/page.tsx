'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/board')
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.svg" alt="JobTracker" className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#8E8E93' }}>Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(255,69,58,0.15)', color: '#FF453A' }}
          >
            {error}
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-semibold text-white mb-4 disabled:opacity-50 active:scale-95 transition-transform"
          style={{ background: '#1C1C1E', minHeight: '52px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: '#2C2C2E' }} />
          <span className="text-sm" style={{ color: '#8E8E93' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#2C2C2E' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-4 text-white rounded-2xl outline-none text-base placeholder:text-[#636366]"
            style={{ background: '#1C1C1E', minHeight: '52px' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="w-full px-4 text-white rounded-2xl outline-none text-base placeholder:text-[#636366]"
            style={{ background: '#1C1C1E', minHeight: '52px' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full text-base font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform"
            style={{ background: '#3B9EFF', minHeight: '52px' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm" style={{ color: '#8E8E93' }}>
          No account?{' '}
          <Link href="/signup" className="font-semibold" style={{ color: '#3B9EFF' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
