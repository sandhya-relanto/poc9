'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ManagerSignupPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

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

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Cannot connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F6F1E8] p-8">
        <div className="w-full max-w-2xl bg-[#EAE2D6] border border-[#D8CCBC] rounded-[3rem] p-16 shadow-2xl text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Organization Initialized</h1>
            <div className="w-12 h-1 bg-[#7D8461] rounded-full mx-auto"></div>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-[#3A2F28] font-bold">Welcome, {name}.</p>
            <p className="text-sm text-[#7B6F63] leading-relaxed">
              Your workspace for <span className="text-[#3A2F28] font-black">{orgName}</span> has been established.<br />
              Representatives can now join your organization using this name.
            </p>
          </div>

          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#7D8461] animate-pulse">
            Redirecting to Intelligence Hub...
          </p>

          <div className="pt-4">
            <Link href="/login" className="inline-block px-12 py-4 bg-[#7D8461] text-[#F6F1E8] text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:bg-[#6B7252]">
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F6F1E8] p-8">
      <div className="w-full max-w-4xl bg-[#EAE2D6] border border-[#D8CCBC] rounded-[3rem] shadow-2xl overflow-hidden">
        
        {/* Branding Header */}
        <div className="p-12 pb-6 text-center border-b border-[#D8CCBC]/30">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-[#7D8461] mb-6">SalesCoach</h2>
          <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight mb-3">Create your organization</h1>
          <p className="text-[#7B6F63] text-base font-medium max-w-lg mx-auto">
            Set up your workspace and start managing your sales coaching operations.
          </p>
        </div>

        <div className="p-16 pt-12">
          {error && (
            <div className="mb-10 p-5 bg-[#A06A5B]/10 border border-[#A06A5B]/20 rounded-2xl text-[#A06A5B] text-[12px] font-black uppercase tracking-widest text-center">
               {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Full Name */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Jane Smith" 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Organization Name */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Organization Name</label>
                <input 
                  type="text" 
                  placeholder="Acme Sales Co." 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              {/* Work Email */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-[#7B6F63] tracking-[0.3em] ml-1">Work Email</label>
                <input 
                  type="email" 
                  placeholder="jane@company.com" 
                  className="w-full bg-[#F3EEE6] border border-[#D8CCBC] rounded-2xl py-3.5 px-6 text-base font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
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
            </div>

            <div className="flex flex-col items-center gap-8 pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="px-16 py-5 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] font-black text-[12px] uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-[#7D8461]/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Initializing Workspace...' : 'Create Organization'}
              </button>

              <div className="flex flex-col md:flex-row items-center gap-4 text-[12px] font-black uppercase tracking-widest text-[#7B6F63]">
                <span>Already have an account? <Link href="/login" className="text-[#7D8461] hover:underline ml-1">Sign In</Link></span>
                <span className="hidden md:inline opacity-30">•</span>
                <span>Joining as a representative? <Link href="/signup/rep" className="text-[#7D8461] hover:underline ml-1">Rep Signup</Link></span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
