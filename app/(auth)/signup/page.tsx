'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Seed default categories for the new user
    if (data.user) {
      await supabase.rpc('seed_default_categories', { p_user_id: data.user.id })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
        Create your account
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Start tracking your finances today
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
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
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-center mt-5" style={{ color: 'var(--color-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
