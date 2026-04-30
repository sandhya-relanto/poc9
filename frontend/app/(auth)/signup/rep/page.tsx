'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function RepSignupPage() {
  const router = useRouter()
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/signup/rep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, inviteCode: inviteCode.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => router.push('/login'), 1500)
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

        <h1 className="auth-title">Join your team</h1>
        <p className="auth-subtitle">
          Sign up as a <strong style={{ color: 'var(--accent-light)' }}>Sales Rep</strong> using the invite code from your manager.
        </p>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="rep-name">Full Name</label>
            <input
              id="rep-name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rep-email">Work Email</label>
            <input
              id="rep-email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rep-password">Password</label>
            <input
              id="rep-password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rep-invite">Invite Code</label>
            <input
              id="rep-invite"
              type="text"
              placeholder="e.g. X7KP2MNQ"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              required
              style={{ letterSpacing: '3px', fontFamily: 'Courier New, monospace', textTransform: 'uppercase' }}
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
            id="rep-signup-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><span className="spinner" />Joining team…</> : 'Join Team'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign In</Link>
          {' · '}
          Creating an org? <Link href="/signup">Manager signup</Link>
        </div>
      </div>
    </div>
  )
}
