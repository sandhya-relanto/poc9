'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminApprovals() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${API}/api/admin/users?approval_status=${tab}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) setUsers(await res.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [tab])

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token')
    try {
      const endpoint = action === 'approve' ? 'approve-manager' : 'reject-manager'
      const res = await fetch(`${API}/api/admin/${endpoint}/${userId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: action === 'reject' ? JSON.stringify({ reason: 'Admin rejection' }) : undefined
      })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-[#D8CCBC] pb-8">
        <div>
           <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Approvals</h1>
           <p className="text-[#7B6F63] font-medium mt-2">Personnel authorization management protocol.</p>
        </div>
      </div>

      <div className="flex gap-4">
        {['pending', 'approved', 'rejected'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === t 
                ? 'bg-[#7D8461] text-[#F6F1E8] shadow-md' 
                : 'bg-[#EAE2D6] text-[#7B6F63] hover:bg-[#D8CCBC]/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#D8CCBC]/30 bg-[#D6C2A8]/10">
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Name / Email</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Role</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Organisation</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CCBC]/20">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-[10px] font-black text-[#7B6F63] uppercase tracking-widest">Synchronising...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center italic text-[#7B6F63] text-[10px] uppercase tracking-widest">No personnel found in this category.</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                  <td className="p-8">
                    <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{user.name}</p>
                    <p className="text-[10px] text-[#7B6F63] font-bold">{user.email}</p>
                  </td>
                  <td className="p-8">
                    <span className="text-[9px] font-black px-3 py-1 bg-[#D8CCBC]/30 rounded-lg text-[#3A2F28] uppercase tracking-widest">{user.role}</span>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-bold text-[#3A2F28] uppercase">{user.organisations?.name || 'N/A'}</p>
                  </td>
                  <td className="p-8">
                    <div className="flex gap-3 justify-center">
                      {tab === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAction(user.id, 'approve')}
                            className="px-6 py-2.5 bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6B7252] transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAction(user.id, 'reject')}
                            className="px-6 py-2.5 bg-[#A06A5B]/10 text-[#A06A5B] border border-[#A06A5B]/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A06A5B]/20 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {tab !== 'pending' && <span className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">{user.approval_status}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
