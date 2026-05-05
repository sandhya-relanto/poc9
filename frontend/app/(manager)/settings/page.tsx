'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SettingsPage() {
  const [manager, setManager] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [teamSize, setTeamSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [success, setSuccess] = useState('')

  const [editName, setEditName] = useState('')
  const [notifications, setNotifications] = useState({
    sessionCompleted: true,
    weeklyReport: true,
    riskAlerts: true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const headers = { 'Authorization': `Bearer ${token}` }

        const [meRes, orgRes, repsRes] = await Promise.all([
          fetch(`${API}/api/users/me`, { headers }),
          fetch(`${API}/api/users/organization`, { headers }),
          fetch(`${API}/api/users/reps`, { headers })
        ])

        if (meRes.ok) {
          const me = await meRes.json()
          setManager(me)
          setEditName(me.name)
        }
        if (orgRes.ok) setOrg(await orgRes.json())
        if (repsRes.ok) {
          const reps = await repsRes.json()
          setTeamSize(reps.length)
        }
      } catch (err) {
        console.error('Failed to fetch settings data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpdateProfile = async () => {
    setUpdating(true)
    setTimeout(() => {
      setManager({ ...manager, name: editName })
      setSuccess('Profile updated successfully.')
      setUpdating(false)
      setTimeout(() => setSuccess(''), 4000)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">System Configuration</h1>
        <p className="text-[#7B6F63] font-medium mt-2 text-base">Governance and professional profile management.</p>
      </div>

      {success && (
        <div className="p-5 bg-[#EAE2D6] border border-[#D8CCBC] rounded-2xl text-[#7D8461] text-[10px] font-black uppercase tracking-widest animate-in fade-in">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col */}
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="px-10 py-8 border-b border-[#D8CCBC]/50 bg-[#EAE2D6]/30">
               <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.2em]">Profile Intelligence</h2>
            </div>
            
            <div className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Manager Name</label>
                     <input 
                       type="text" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl py-4 px-6 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all"
                     />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Professional Email</label>
                     <div className="w-full bg-[#F6F1E8]/50 border border-[#D8CCBC]/30 rounded-2xl py-4 px-6 text-sm font-bold text-[#7B6F63] cursor-not-allowed">
                        {manager?.email}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Authority Role</p>
                     <p className="text-sm font-extrabold text-[#7D8461] uppercase tracking-tight ml-1">{manager?.role || 'Sales Manager'}</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Organization</p>
                     <p className="text-sm font-extrabold text-[#3A2F28] ml-1 uppercase tracking-tight">{org?.name || 'Intelligence Unit'}</p>
                  </div>
               </div>

               <div className="pt-6">
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    className="px-10 py-4 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-md transition-all disabled:opacity-50"
                  >
                    {updating ? 'Synchronizing...' : 'Update Infrastructure'}
                  </button>
               </div>
            </div>
          </section>

          <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="px-10 py-8 border-b border-[#D8CCBC]/50 bg-[#EAE2D6]/30">
               <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.2em]">Notification Protocols</h2>
            </div>
            <div className="p-10 space-y-6">
               {[
                 { key: 'sessionCompleted', label: 'Real-time Session Completion Alerts', desc: 'Instant alerts when a rep finishes a module.' },
                 { key: 'riskAlerts', label: 'Performance Risk Intelligence', desc: 'Critical coaching and trend alerts.' },
                 { key: 'weeklyReport', label: 'Weekly Consolidated Intelligence Briefing', desc: 'Executive performance summary.' }
               ].map((pref) => (
                 <div key={pref.key} className="flex items-center justify-between p-8 bg-[#F6F1E8] rounded-3xl border border-[#D8CCBC]/40 hover:border-[#7D8461]/30 transition-all">
                    <div className="space-y-2">
                       <p className="text-sm font-bold text-[#3A2F28] uppercase tracking-tight">{pref.label}</p>
                       <p className="text-[10px] text-[#7B6F63] font-medium">{pref.desc}</p>
                    </div>
                    <button 
                      onClick={() => setNotifications({...notifications, [pref.key]: !((notifications as any)[pref.key])})}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${ (notifications as any)[pref.key] ? 'bg-[#7D8461]' : 'bg-[#D6C2A8]'}`}
                    >
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm duration-300 ${ (notifications as any)[pref.key] ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
               ))}
            </div>
          </section>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-4 space-y-12">
          <section className="bg-[#D6C2A8] rounded-[2.5rem] p-12 text-[#3A2F28] shadow-sm relative overflow-hidden border border-[#D8CCBC]">
            <div className="relative z-10 space-y-12">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">Operational Scope</p>
                  <h3 className="text-3xl font-extrabold tracking-tighter uppercase">{org?.name || 'Unit Alpha'}</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-10">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Force Size</p>
                     <p className="text-5xl font-extrabold tracking-tighter">{teamSize}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">System Tier</p>
                     <p className="text-5xl font-extrabold tracking-tighter">E-1</p>
                  </div>
               </div>

               <div className="pt-6">
                  <div className="inline-block px-6 py-2.5 bg-[#F6F1E8]/40 rounded-full border border-[#D8CCBC] text-[9px] font-black uppercase tracking-widest">
                     Enterprise Verified
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-[#EAE2D6] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-6">
             <h4 className="text-[10px] font-black uppercase text-[#7B6F63] tracking-[0.4em] ml-1 mb-4">Administrative</h4>
             <div className="space-y-4">
                <button className="w-full py-5 px-8 bg-[#F6F1E8] hover:bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl text-left text-[10px] font-black uppercase tracking-widest transition-all">Change Security Key</button>
                <button className="w-full py-5 px-8 bg-[#F6F1E8] hover:bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl text-left text-[10px] font-black uppercase tracking-widest transition-all">Export Team Audit</button>
                <button className="w-full py-5 px-8 bg-[#A06A5B]/10 hover:bg-[#A06A5B]/20 border border-[#A06A5B]/20 text-[#A06A5B] rounded-2xl text-left text-[10px] font-black uppercase tracking-widest transition-all">Request Deletion</button>
             </div>
          </section>
        </div>
      </div>
    </div>
  )
}
