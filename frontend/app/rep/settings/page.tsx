'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function RepSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) setUser(await res.json())
      } catch (err) {
        console.error('Failed to fetch user data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 text-left">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">System Settings</h1>
        <p className="text-[#7B6F63] font-medium text-base">Personal governance and operational profile metrics.</p>
      </div>

      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
         <div className="p-10 border-b border-[#D8CCBC]/50 bg-[#EAE2D6]/30">
            <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.2em]">Agent Identification</h2>
            <p className="text-[9px] text-[#7B6F63] font-bold uppercase tracking-widest mt-1">Verified Personnel Details</p>
         </div>
         <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Full Name</p>
                  <p className="text-lg font-bold text-[#3A2F28] tracking-tight">{user?.name}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Professional Email</p>
                  <p className="text-lg font-bold text-[#7D8461]">{user?.email}</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#D8CCBC]/50">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Operational Role</p>
                  <p className="text-sm font-bold text-[#3A2F28] uppercase tracking-tight">Sales Representative</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Assigned Organization</p>
                  <p className="text-sm font-bold text-[#3A2F28] uppercase tracking-tight">Intelligence Operations Unit</p>
               </div>
            </div>
         </div>
      </section>

      <section className="bg-[#EAE2D6] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-10">
         <h4 className="text-[9px] font-black uppercase text-[#7B6F63] tracking-[0.4em]">Administrative Protocols</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button className="w-full py-5 px-8 bg-[#F6F1E8] hover:bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl text-left text-[9px] font-black uppercase tracking-widest transition-all">Update Security Key</button>
            <button className="w-full py-5 px-8 bg-[#A06A5B]/10 hover:bg-[#A06A5B]/20 border border-[#A06A5B]/20 text-[#A06A5B] rounded-2xl text-left text-[9px] font-black uppercase tracking-widest transition-all">Request Deactivation</button>
         </div>
      </section>
    </div>
  )
}
