'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminManagers() {
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchManagers = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await fetch(`${API}/api/admin/managers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) setManagers(await res.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchManagers()
  }, [])

  const toggleActive = async (userId: string, current: boolean) => {
    const token = localStorage.getItem('token')
    const action = current ? 'deactivate' : 'activate'
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setManagers(prev => prev.map(m => m.id === userId ? { ...m, is_active: !current } : m))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-[#D8CCBC] pb-8">
        <div>
           <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Managers</h1>
           <p className="text-[#7B6F63] font-medium mt-2">Executive personnel management and organisational mapping.</p>
        </div>
      </div>

      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#D6C2A8]/10 border-b border-[#D8CCBC]/30">
              <tr>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Name / Email</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Organisation</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Reps</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Status</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CCBC]/20">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-[10px] font-black text-[#7B6F63] uppercase tracking-widest">Retrieving Directory...</td></tr>
              ) : managers.map(m => (
                <tr key={m.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                  <td className="p-8">
                    <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{m.name}</p>
                    <p className="text-[10px] text-[#7B6F63] font-bold">{m.email}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-bold text-[#3A2F28] uppercase">{m.organisations?.name || 'N/A'}</p>
                  </td>
                  <td className="p-8 text-xs font-bold text-[#3A2F28] uppercase">
                    {m.rep_count}
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${m.approval_status === 'approved' || !m.approval_status ? 'bg-[#7D8461]' : m.approval_status === 'pending' ? 'bg-[#D6C2A8]' : 'bg-[#A06A5B]'}`}></div>
                       <span className="text-[10px] font-bold text-[#3A2F28] uppercase tracking-tight">
                         {m.approval_status || 'Approved'}
                       </span>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex gap-4 justify-end">
                       <button className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest hover:text-[#7D8461]">🔑 Reset</button>
                       <button 
                         onClick={() => toggleActive(m.id, m.is_active)}
                         className={`text-[9px] font-black uppercase tracking-widest ${m.is_active ? 'text-[#A06A5B]' : 'text-[#7D8461]'}`}
                       >
                         {m.is_active ? '⛔ Deactivate' : '✅ Activate'}
                       </button>
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
