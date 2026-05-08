'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [pendingManagers, setPendingManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      try {
        const [statsRes, pendingRes] = await Promise.all([
          fetch(`${API}/api/admin/stats`, { headers }),
          fetch(`${API}/api/admin/pending-managers`, { headers })
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (pendingRes.ok) setPendingManagers(await pendingRes.json())
      } catch (err) {
        console.error('Failed to fetch admin data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApprove = async (userId: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/api/admin/approve-manager/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setPendingManagers(prev => prev.filter(u => u.id !== userId))
        // Refresh stats
        const statsRes = await fetch(`${API}/api/admin/stats`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (statsRes.ok) setStats(await statsRes.json())
      }
    } catch (err) {
      console.error('Approval failed', err)
    }
  }

  if (loading) return <div className="animate-pulse text-[#7B6F63] font-black uppercase tracking-widest p-20 text-center">Initialising Command Center...</div>

  return (
    <div className="space-y-12">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Managers" value={stats?.total_managers || 0} icon="🏢" />
        <StatCard 
          title="Pending" 
          value={stats?.pending_managers || 0} 
          icon="⏳" 
          highlight={stats?.pending_managers > 0} 
        />
        <StatCard title="Reps" value={stats?.total_reps || 0} icon="👥" />
        <StatCard title="Sessions" value={stats?.sessions_today || 0} label="Today" icon="🎯" />
        <StatCard title="Avg Score" value={`${stats?.avg_score || 0}%`} icon="📈" />
      </div>

      {/* Manager Approval Queue */}
      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[#D8CCBC]/50 bg-[#D6C2A8]/10 flex justify-between items-center">
           <div>
              <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Manager Approval Queue</h2>
              <p className="text-[9px] text-[#7B6F63] font-bold uppercase mt-1">Personnel Authorization Protocol</p>
           </div>
           <span className="bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest">
             {pendingManagers.length} PENDING
           </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#D8CCBC]/30">
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Name / Email</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Organisation</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Requested</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CCBC]/20">
              {pendingManagers.map((m) => (
                <tr key={m.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                  <td className="p-8">
                    <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{m.name}</p>
                    <p className="text-[10px] text-[#7B6F63] font-bold">{m.email}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-bold text-[#3A2F28] uppercase">{m.organisations?.name || 'N/A'}</p>
                  </td>
                  <td className="p-8 text-[10px] font-bold text-[#7B6F63] uppercase">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-8">
                    <div className="flex gap-3 justify-center">
                      <button 
                        onClick={() => handleApprove(m.id)}
                        className="px-6 py-2.5 bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6B7252] transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="px-6 py-2.5 bg-[#A06A5B]/10 text-[#A06A5B] border border-[#A06A5B]/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A06A5B]/20 transition-all"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingManagers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.3em] opacity-40 italic">
                      No pending manager approvals
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ title, value, label, icon, highlight = false }: any) {
  return (
    <div className={`p-8 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${highlight ? 'ring-1 ring-[#A06A5B]/50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">{title}</p>
        <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <p className="text-3xl font-extrabold text-[#3A2F28] tracking-tighter">{value}</p>
      {label && <p className="text-[8px] font-black text-[#7B6F63] uppercase tracking-widest mt-1">{label}</p>}
      {highlight && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-[#A06A5B] rounded-full animate-pulse"></div>}
    </div>
  )
}
