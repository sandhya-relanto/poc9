'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      try {
        const [statsRes, pendingRes, usersRes] = await Promise.all([
          fetch(`${API}/api/users/admin/stats`, { headers }),
          fetch(`${API}/api/users/admin/pending`, { headers }),
          fetch(`${API}/api/users/admin/users`, { headers })
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (pendingRes.ok) setPendingUsers(await pendingRes.json())
        if (usersRes.ok) setAllUsers(await usersRes.json())
      } catch (err) {
        console.error('Failed to fetch admin data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAction = async (userId: string, status: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/api/users/admin/update-user`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, status })
      })
      if (res.ok) {
        // Refresh data
        window.location.reload()
      }
    } catch (err) {
      console.error('Action failed', err)
    }
  }

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 font-jakarta">
      {/* Header */}
      <div className="border-b border-[#D8CCBC] pb-8">
        <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Admin Command Center</h1>
        <p className="text-[#7B6F63] font-medium mt-2">Platform-wide oversight and strategic governance.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Managers', value: stats?.totalManagers || 0, icon: '🏢' },
          { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: '⏳', highlight: true },
          { label: 'Total Reps', value: stats?.totalReps || 0, icon: '👥' },
          { label: 'Sessions Today', value: stats?.sessionsToday || 0, icon: '🎯' },
          { label: 'Avg Score', value: `${stats?.avgScore || 0}%`, icon: '📈' }
        ].map((card, i) => (
          <div key={i} className={`p-8 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2rem] shadow-sm ${card.highlight ? 'ring-2 ring-[#7D8461]/30' : ''}`}>
            <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.2em] mb-4">{card.icon} {card.label}</p>
            <p className="text-3xl font-black text-[#3A2F28]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Pending Queue */}
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-[#D8CCBC]/50 bg-[#D6C2A8]/10 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Manager Approval Queue</h2>
              <span className="bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black px-3 py-1 rounded-lg">{pendingUsers.filter(u => u.role === 'manager').length} PENDING</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D8CCBC]/30">
                    <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Name / Email</th>
                    <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Company</th>
                    <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.filter(u => u.role === 'manager').map((user) => (
                    <tr key={user.id} className="border-b border-[#D8CCBC]/20 hover:bg-[#F6F1E8]/50 transition-all">
                      <td className="p-6">
                        <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] text-[#7B6F63] font-bold">{user.email}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-bold text-[#3A2F28] uppercase">{user.company || 'N/A'}</p>
                        <p className="text-[9px] text-[#7B6F63] font-black uppercase tracking-widest">{user.team_size || '1-10'} reps</p>
                      </td>
                      <td className="p-6">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => handleAction(user.id, 'approved')}
                            className="px-4 py-2 bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6B7252] transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAction(user.id, 'rejected')}
                            className="px-4 py-2 bg-[#A06A5B]/10 text-[#A06A5B] border border-[#A06A5B]/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A06A5B]/20 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingUsers.filter(u => u.role === 'manager').length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[#7B6F63] text-[10px] font-black uppercase tracking-widest opacity-50">
                        No pending manager requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Platform Analytics Charts Placeholder */}
          <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 shadow-sm">
             <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em] mb-8">Platform Activity Trends</h2>
             <div className="h-64 flex items-center justify-center border border-dashed border-[#D8CCBC] rounded-[2rem] bg-[#F6F1E8]/50">
                <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Activity Visualization Matrix</p>
             </div>
          </section>
        </div>

        {/* Right: User Management */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em] mb-8">User Management</h2>
            <div className="space-y-4">
              {allUsers.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-[#F6F1E8] rounded-2xl border border-[#D8CCBC]/50">
                  <div>
                    <p className="text-[10px] font-bold text-[#3A2F28] uppercase tracking-tight">{user.name}</p>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-[#A06A5B]' : 'text-[#7D8461]'}`}>{user.role}</p>
                  </div>
                  <div className="flex gap-2">
                     <span className={`w-2 h-2 rounded-full ${user.status === 'approved' ? 'bg-[#7D8461]' : 'bg-[#A06A5B]'}`}></span>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.3em] hover:text-[#3A2F28] transition-all pt-4">View All Personnel →</button>
            </div>
          </section>

          <section className="bg-[#EAE2D6] border border-[#D8CCBC] rounded-[2.5rem] p-8 shadow-sm text-center">
             <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.3em] mb-4">Security Protocol</p>
             <button className="w-full py-4 bg-[#3A2F28] text-[#F6F1E8] text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#2A211D] transition-all">Deactivate Platform Access</button>
          </section>
        </div>

      </div>
    </div>
  )
}
