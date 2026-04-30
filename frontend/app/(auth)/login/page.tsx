'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Store session
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('orgId', data.orgId)
      localStorage.setItem('name', data.name)

      setSuccess(`Welcome back, ${data.name}! Redirecting…`)

      setTimeout(() => {
        if (data.role === 'manager') {
          router.push('/dashboard')
        } else {
          router.push('/my-stats')
        }
      }, 1200)
    } catch {
      setError('Cannot connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">⚡</div>
          <span className="auth-brand-name">SalesCoach</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue coaching.</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>✓</span> {success}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><span className="spinner" />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          No account?{' '}
          <Link href="/signup">Create one as Manager</Link>
          {' · '}
          <Link href="/signup/rep">Join as Rep</Link>
        </div>
      </div>
    </div>
  )
}
