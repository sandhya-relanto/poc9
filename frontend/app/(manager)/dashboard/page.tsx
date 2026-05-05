'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const headers = { 'Authorization': `Bearer ${token}` }
        const [statsRes, analyticsRes] = await Promise.all([
          fetch(`${API}/api/users/dashboard-stats`, { headers }),
          fetch(`${API}/api/users/team-analytics`, { headers })
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Executive Intelligence</h1>
          <p className="text-[#7B6F63] font-medium mt-2 text-base">Organizational performance and strategic operational oversight.</p>
        </div>
        <div className="flex gap-4">
           <Link 
             href="/training" 
             className="px-8 py-4 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-md transition-all"
           >
             Deploy Mission
           </Link>
           <Link 
             href="/coaching" 
             className="px-8 py-4 bg-[#D6C2A8] hover:bg-[#C5B095] text-[#3A2F28] font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-[#D8CCBC] shadow-sm transition-all"
           >
             Coaching Center
           </Link>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <StatCard title="Team Force" value={stats?.totalReps || 0} label="Active Sales Personnel" />
        <StatCard title="Active Operations" value={stats?.activeSessions || 0} label="Tactical Simulations" />
        <StatCard title="Avg Proficiency" value={`${stats?.avgTeamScore || 0}%`} label="Lifetime Aggregate" />
        <StatCard title="Risk Analysis" value={stats?.repsNeedingAttention || 0} label="Requires Direct Coaching" isAlert={stats?.repsNeedingAttention > 0} />
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Trend Analysis */}
          <div className="lg:col-span-8 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm">
             <div className="flex justify-between items-center mb-12">
               <div>
                 <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Performance Trajectory</h3>
                 <p className="text-xs text-[#7B6F63] mt-1">Weighted team proficiency over time</p>
               </div>
               <span className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest bg-[#F6F1E8] px-4 py-2 rounded-xl border border-[#D8CCBC]">System Live</span>
             </div>
             <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8CCBC" vertical={false} />
                    <XAxis dataKey="date" stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#EFE7DC', border: '1px solid #D8CCBC', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(58, 47, 40, 0.1)' }} 
                      itemStyle={{ color: '#7D8461', fontWeight: '800', fontSize: '12px' }} 
                    />
                    <Line type="monotone" dataKey="score" stroke="#7D8461" strokeWidth={4} dot={{ r: 4, fill: '#7D8461', strokeWidth: 2, stroke: '#F6F1E8' }} activeDot={{ r: 6, stroke: '#7D8461', strokeWidth: 2 }} />
                  </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Skill Matrix */}
          <div className="lg:col-span-4 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm">
             <div className="mb-12">
               <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Skill Distribution</h3>
               <p className="text-xs text-[#7B6F63] mt-1">Aggregate team competency matrix</p>
             </div>
             <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.radarData}>
                    <PolarGrid stroke="#D8CCBC" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#7B6F63', fontSize: 9, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Team Avg" dataKey="A" stroke="#7D8461" fill="#7D8461" fillOpacity={0.15} />
                  </RadarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Persona Insights */}
          <div className="lg:col-span-6 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm">
             <div className="mb-10">
               <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Persona Intelligence</h3>
               <p className="text-xs text-[#7B6F63] mt-1">Success correlation by prospect archetype</p>
             </div>
             <div className="space-y-6">
               {analytics.personaPerformanceData?.slice(0, 4).map((p: any, idx: number) => (
                 <div key={idx} className="p-8 bg-[#F6F1E8] border border-[#D8CCBC] rounded-[2rem] hover:border-[#7D8461] transition-all flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-base font-bold text-[#3A2F28] uppercase tracking-tight">{p.type}</p>
                        <p className="text-[9px] text-[#7B6F63] font-black uppercase tracking-[0.2em] mt-1">{p.sessionsCompleted} Missions</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-3xl font-extrabold ${p.avgScore < 60 ? 'text-[#A06A5B]' : p.avgScore < 75 ? 'text-[#D6C2A8]' : 'text-[#7D8461]'}`}>
                         {p.avgScore}%
                       </p>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Mission Stats */}
          <div className="lg:col-span-6 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm">
             <div className="mb-10">
               <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Tactical Correlation</h3>
               <p className="text-xs text-[#7B6F63] mt-1">Mission difficulty vs Team proficiency mapping</p>
             </div>
             <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.scenarioData} layout="vertical" margin={{ left: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#7B6F63" fontSize={10} width={120} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(214, 194, 168, 0.15)' }} 
                      contentStyle={{ backgroundColor: '#EFE7DC', border: '1px solid #D8CCBC', borderRadius: '1.5rem' }} 
                    />
                    <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={24}>
                      {analytics.scenarioData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#7D8461' : entry.score >= 60 ? '#D6C2A8' : '#A06A5B'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, label, isAlert = false }: any) {
  return (
    <div className="bg-[#EFE7DC] border border-[#D8CCBC] p-10 rounded-[2.5rem] hover:shadow-lg transition-all group relative overflow-hidden">
      {isAlert && <span className="absolute top-6 right-6 w-3 h-3 bg-[#A06A5B] rounded-full animate-pulse shadow-sm shadow-[#A06A5B]/30"></span>}
      <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.3em] mb-4">{title}</p>
      <h3 className="text-5xl font-extrabold text-[#3A2F28] mb-2 tracking-tighter">{value}</h3>
      <p className="text-[9px] text-[#82786F] font-bold uppercase tracking-widest mt-1 opacity-80">{label}</p>
    </div>
  )
}

