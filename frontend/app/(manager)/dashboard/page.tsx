'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [pendingReps, setPendingReps] = useState<any[]>([])
  const [teamReps, setTeamReps] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      try {
        const [statsRes, pendingRes, repsRes] = await Promise.all([
          fetch(`${API}/api/manager/my-reps`, { headers }), // We'll use this for stats & list
          fetch(`${API}/api/manager/pending-reps`, { headers }),
          fetch(`${API}/api/users/dashboard-stats`, { headers }) // existing stats
        ])

        if (statsRes.ok) setTeamReps(await statsRes.json())
        if (pendingRes.ok) setPendingReps(await pendingRes.json())
        if (repsRes.ok) setStats(await repsRes.json())
      } catch (err) {
        console.error('Failed to fetch manager dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRepAction = async (repId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token')
    try {
      const endpoint = action === 'approve' ? 'approve-rep' : 'reject-rep'
      const res = await fetch(`${API}/api/manager/${endpoint}/${repId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setPendingReps(prev => prev.filter(r => r.id !== repId))
        window.location.reload()
      }
    } catch (err) {
      console.error('Action failed', err)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-jakarta">
      {/* Pending Reps Alert Section */}
      {pendingReps.length > 0 && (
        <section className="bg-[#A06A5B]/5 border border-[#A06A5B]/20 rounded-[2rem] p-8 shadow-sm">
           <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-4">
                 <span className="text-2xl animate-pulse">⚠️</span>
                 <h2 className="text-sm font-black text-[#3A2F28] uppercase tracking-widest">
                   {pendingReps.length} reps are waiting for your approval
                 </h2>
              </div>
           </div>
           <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-[#D6C2A8]/10">
                    <tr className="border-b border-[#D8CCBC]/30">
                       <th className="p-5 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Name / Email</th>
                       <th className="p-5 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest text-center">Requested</th>
                       <th className="p-5 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#D8CCBC]/20">
                    {pendingReps.map(rep => (
                       <tr key={rep.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                          <td className="p-5">
                             <p className="text-xs font-bold text-[#3A2F28] uppercase">{rep.name}</p>
                             <p className="text-[9px] text-[#7B6F63] font-bold">{rep.email}</p>
                          </td>
                          <td className="p-5 text-[10px] font-bold text-[#7B6F63] uppercase text-center">
                             {new Date(rep.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-5">
                             <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleRepAction(rep.id, 'approve')}
                                  className="px-5 py-2 bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6B7252]"
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => handleRepAction(rep.id, 'reject')}
                                  className="px-5 py-2 bg-[#A06A5B]/10 text-[#A06A5B] border border-[#A06A5B]/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A06A5B]/20"
                                >
                                  ✗ Reject
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Reps" value={stats?.totalReps || 0} icon="👥" />
        <StatCard title="Pending" value={pendingReps.length} icon="⏳" highlight={pendingReps.length > 0} />
        <StatCard title="Avg Score" value={`${stats?.avgTeamScore || 0}%`} icon="📈" />
        <StatCard title="Weekly Target" value="92%" icon="🎯" label="Benchmark" />
      </div>

      {/* AI INTELLIGENCE & COACHING HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Coaching Priorities */}
         <section className="lg:col-span-2 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-8 shadow-sm">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">AI Coaching Priorities</h2>
               <span className="bg-[#7D8461] text-[#F6F1E8] text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">High Impact</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                  { title: 'Opening Effectiveness', rep: 'Sarah J.', risk: 'Medium', tip: 'Sarah is missing the agenda in 40% of calls.' },
                  { title: 'Objection Handling', rep: 'Marcus K.', risk: 'High', tip: 'Marcus struggles with competitor comparisons.' }
               ].map(item => (
                  <div key={item.rep} className="p-8 bg-[#F6F1E8] border border-[#D8CCBC] rounded-[2rem] hover:border-[#7D8461] transition-all group">
                     <div className="flex justify-between items-center mb-4">
                        <p className="text-[9px] font-black text-[#7D8461] uppercase tracking-widest">{item.title}</p>
                        <span className={`w-2.5 h-2.5 rounded-full ${item.risk === 'High' ? 'bg-[#A06A5B]' : 'bg-[#D6C2A8]'}`}></span>
                     </div>
                     <p className="text-xl font-bold text-[#3A2F28] mb-2">{item.rep}</p>
                     <p className="text-xs text-[#7B6F63] font-medium leading-relaxed italic">"{item.tip}"</p>
                     <div className="mt-6 pt-6 border-t border-[#D8CCBC]/50 flex justify-between items-center">
                        <span className="text-[8px] font-black text-[#3A2F28] uppercase tracking-widest">Risk: {item.risk}</span>
                        <button className="text-[8px] font-black text-[#7D8461] uppercase tracking-widest hover:underline">Deploy Scenario →</button>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Burnout & Risk Indicators */}
         <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-8 shadow-sm">
            <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Team Risk Alerts</h2>
            <div className="space-y-6">
               {[
                  { name: 'David L.', type: 'Burnout Risk', score: '82%', icon: '🔥' },
                  { name: 'Elena V.', type: 'Declining Trend', score: '-12%', icon: '📉' },
                  { name: 'Tom R.', type: 'Buyer Friction', score: 'Low Mood', icon: '😤' }
               ].map(alert => (
                  <div key={alert.name} className="flex items-center gap-6 p-6 bg-[#F6F1E8] rounded-2xl border border-[#D8CCBC]/50 hover:shadow-md transition-all">
                     <div className="w-12 h-12 rounded-xl bg-[#EAE2D6] flex items-center justify-center text-xl shadow-inner border border-[#D8CCBC]/30">
                        {alert.icon}
                     </div>
                     <div>
                        <p className="text-[9px] text-[#A06A5B] font-black uppercase tracking-widest mb-1">{alert.type}</p>
                        <p className="text-sm text-[#3A2F28] font-bold">{alert.name} • <span className="text-[#7B6F63]">{alert.score}</span></p>
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full py-4 text-[9px] font-black text-[#7B6F63] hover:text-[#3A2F28] uppercase tracking-[0.3em] border-t border-[#D8CCBC]/50 pt-8">View Detailed Risk Audit →</button>
         </section>
      </div>

      {/* Existing Rep Table Section (Visual Design Maintained) */}
      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[#D8CCBC]/50 bg-[#EAE2D6]/30">
          <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Representative Force Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8CCBC]/30">
                <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Personnel</th>
                <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Average Score</th>
                <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Volume</th>
                <th className="p-6 text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Status</th>
                <th className="p-6 text-right text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CCBC]/10">
              {teamReps.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                  <td className="p-6">
                    <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{rep.name}</p>
                    <p className="text-[9px] text-[#7B6F63] font-black uppercase tracking-widest">ID: {rep.id.slice(0, 8)}</p>
                  </td>
                  <td className="p-6">
                    <span className={`text-xl font-black ${rep.avg_score >= 80 ? 'text-[#7D8461]' : rep.avg_score >= 60 ? 'text-[#D6C2A8]' : 'text-[#A06A5B]'}`}>
                      {rep.avg_score}%
                    </span>
                  </td>
                  <td className="p-6 text-xs font-bold text-[#3A2F28] uppercase">{rep.session_count} Sessions</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${rep.is_active ? 'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20' : 'bg-[#A06A5B]/10 text-[#A06A5B] border-[#A06A5B]/20'}`}>
                      {rep.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <Link href={`/manager/reps/${rep.id}`} className="text-[9px] font-black text-[#7D8461] uppercase tracking-widest hover:underline">Full Analytics →</Link>
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

function StatCard({ title, value, label, icon, highlight = false }: any) {
  return (
    <div className={`p-10 rounded-[2.5rem] bg-[#EFE7DC] border border-[#D8CCBC] shadow-sm transition-all hover:shadow-lg ${highlight ? 'ring-2 ring-[#A06A5B]/30 bg-[#A06A5B]/5' : ''}`}>
      <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.3em] mb-4">{title}</p>
      <div className="flex items-end justify-between">
         <h3 className="text-5xl font-extrabold text-[#3A2F28] tracking-tighter leading-none">{value}</h3>
         <span className="text-2xl opacity-30">{icon}</span>
      </div>
      {label && <p className="text-[9px] text-[#82786F] font-bold uppercase tracking-widest mt-4 opacity-80">{label}</p>}
    </div>
  )
}
