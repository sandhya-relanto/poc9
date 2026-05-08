'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function RepSignupPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [managerId, setManagerId] = useState('')
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [fetchingManagers, setFetchingManagers] = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch(`${API}/api/auth/approved-managers`)
        if (res.ok) {
          const data = await res.json()
          setManagers(data)
        }
      } catch (err) {
        console.error('Failed to fetch managers', err)
      } finally {
        setFetchingManagers(false)
      }
    }
    fetchManagers()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerId) {
      setError('Please select a manager.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/signup/rep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, managerId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      setSuccess(true)
    } catch {
      setError('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F1E8] p-8 text-center">
        <div className="w-full max-w-2xl bg-[#EAE2D6] border border-[#D8CCBC] rounded-[3rem] p-16 shadow-2xl space-y-10">
          <div className="space-y-4">
             <div className="text-6xl mb-6">✓</div>
             <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Request Submitted</h1>
             <div className="w-12 h-1 bg-[#7D8461] rounded-full mx-auto"></div>
          </div>
          
          <p className="text-[#7B6F63] text-lg font-medium leading-relaxed max-w-md mx-auto">
             Your account is awaiting approval from your manager. 
             You will receive access once they approve your request.
          </p>

          <div className="pt-8">
            <Link href="/login" className="inline-block px-12 py-4 bg-[#7D8461] text-[#F6F1E8] text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-[#6B7252]">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F6F1E8] p-8">
      <div className="w-full max-w-4xl bg-[#EAE2D6] border border-[#D8CCBC] rounded-[3rem] shadow-2xl overflow-hidden">
        
        <div className="p-12 pb-6 text-center border-b border-[#D8CCBC]/30">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#7D8461] mb-6">SALESCOACH</h2>
          <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight mb-3">Join Your Team</h1>
          <p className="text-[#7B6F63] text-base font-medium">Connect with your sales manager</p>
        </div>

        <div className="p-16 pt-12">
          {error && (
            <div className="mb-10 p-5 bg-[#A06A5B]/10 border border-[#A06A5B]/20 rounded-2xl text-[#A06A5B] text-[12px] font-black uppercase tracking-widest text-center">
               {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Alex Johnson" 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Work Email</label>
                <input 
                  type="email" 
                  placeholder="alex@company.com" 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Select Your Manager</label>
                <select 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  required
                >
                   <option value="">{fetchingManagers ? 'Loading managers...' : 'Select your manager...'}</option>
                   {managers.map(m => (
                     <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                   ))}
                </select>
                {managers.length === 0 && !fetchingManagers && (
                  <p className="text-[10px] text-[#A06A5B] font-bold uppercase mt-2 ml-1">No managers available yet</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 pt-6">
              <button 
                type="submit" 
                disabled={loading || managers.length === 0} 
                className="px-16 py-5 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] font-black text-[12px] uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-[#7D8461]/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Join Team'}
              </button>

              <div className="text-[12px] font-black uppercase tracking-widest text-[#7B6F63]">
                Already have an account? <Link href="/login" className="text-[#7D8461] hover:underline ml-1">Sign In</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
