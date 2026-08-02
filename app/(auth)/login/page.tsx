'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
        Welcome back
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Sign in to your account
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-md"
            style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-center mt-5" style={{ color: 'var(--color-muted)' }}>
        No account?{' '}
        <Link href="/signup" className="font-medium" style={{ color: 'var(--color-accent)' }}>
          Create one
        </Link>
      </p>
    </div>
  )
}
