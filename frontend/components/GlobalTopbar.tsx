'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function GlobalTopbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch(`${API}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setUser(data))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    router.push('/login')
  }

  const roleLabels: any = {
    admin: 'Administrator',
    manager: 'Management',
    rep: 'Representative'
  }

  const roleWorkspace: any = {
    admin: 'Command Center',
    manager: 'Executive Hub',
    rep: 'Performance Workspace'
  }

  return (
    <header className="h-20 bg-[#F6F1E8]/80 backdrop-blur-md border-b border-[#D8CCBC] flex items-center justify-between px-12 sticky top-0 z-40 font-jakarta">
      <div className="flex items-center gap-4">
        <h2 className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.2em] hidden sm:block">
          {roleLabels[user?.role] || 'Personnel'} /
        </h2>
        <h2 className="text-xs font-extrabold text-[#7D8461] uppercase tracking-wider">
          {roleWorkspace[user?.role] || 'Intelligence Portal'}
        </h2>
      </div>

      <div className="flex items-center gap-8">
        {user?.role === 'rep' && (
          <Link 
            href="/rep/train" 
            className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm transition-all"
          >
            <span>🚀</span> Start Mission
          </Link>
        )}

        <div className="relative group">
          <button className="flex items-center gap-4 pl-4 pr-5 py-2.5 hover:bg-[#EAE2D6] rounded-2xl transition-all border border-transparent hover:border-[#D8CCBC]">
            <div className="w-9 h-9 bg-[#7D8461] rounded-xl flex items-center justify-center text-xs font-black text-[#F6F1E8] shadow-sm uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-black text-[#3A2F28] leading-tight uppercase tracking-tight">{user?.name || 'Authorized User'}</p>
              <p className="text-[9px] text-[#7B6F63] font-bold uppercase tracking-[0.2em] mt-0.5">
                {user?.role === 'admin' ? 'Root Access' : user?.role === 'manager' ? 'Unit Director' : 'Sales Agent'}
              </p>
            </div>
          </button>

          <div className="absolute right-0 w-52 pt-3 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
            <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] shadow-2xl overflow-hidden p-2">
              <Link href={user?.role === 'rep' ? '/rep/settings' : '#'} className="block px-6 py-4 text-[10px] font-black text-[#3A2F28] uppercase tracking-widest hover:bg-[#D8CCBC]/20 rounded-2xl transition-all">Profile</Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-6 py-4 text-[10px] font-black text-[#A06A5B] uppercase tracking-widest hover:bg-[#A06A5B]/10 rounded-2xl transition-all flex items-center gap-3"
              >
                <span>🚪</span> Terminate Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
