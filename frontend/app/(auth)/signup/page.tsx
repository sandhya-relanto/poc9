'use client'

import { useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ManagerSignupPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied]     = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/signup/manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, orgName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      setInviteCode(data.inviteCode)
    } catch {
      setError('Cannot connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inviteCode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon">⚡</div>
            <span className="auth-brand-name">SalesCoach</span>
          </div>

          <h1 className="auth-title">Organisation created! 🎉</h1>
          <p className="auth-subtitle">
            Share this invite code with your sales reps so they can join your team.
          </p>

          <div className="invite-box">
            <div>
              <div className="invite-box-label">Your invite code</div>
              <div className="invite-code">{inviteCode}</div>
            </div>
            <button id="copy-invite-btn" className="copy-btn" onClick={copyCode}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="auth-footer" style={{ marginTop: '24px' }}>
            <Link href="/login">Go to Login →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">⚡</div>
          <span className="auth-brand-name">SalesCoach</span>
        </div>

        <h1 className="auth-title">Create your org</h1>
        <p className="auth-subtitle">
          Sign up as a <strong style={{ color: 'var(--accent-light)' }}>Manager</strong> and get an invite code to share with your reps.
        </p>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="mgr-name">Full Name</label>
            <input
              id="mgr-name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mgr-org">Organisation Name</label>
            <input
              id="mgr-org"
              type="text"
              placeholder="Acme Sales Co."
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mgr-email">Work Email</label>
            <input
              id="mgr-email"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mgr-password">Password</label>
            <input
              id="mgr-password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            id="mgr-signup-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <><span className="spinner" />Creating org…</> : 'Create Organisation'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign In</Link>
          {' · '}
          Joining as rep? <Link href="/signup/rep">Rep signup</Link>
        </div>
      </div>
    </div>
  )
}
