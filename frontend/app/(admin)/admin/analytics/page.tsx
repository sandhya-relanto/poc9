'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      try {
        const res = await fetch(`${API}/api/admin/stats`, { headers })
        if (res.ok) {
          const stats = await res.json()
          // Mock some time-series data for the charts since we don't have historical stats in the current simple schema
          const mockTrend = [
            { date: 'Mon', sessions: 12, score: 68 },
            { date: 'Tue', sessions: 18, score: 72 },
            { date: 'Wed', sessions: 15, score: 70 },
            { date: 'Thu', sessions: 22, score: 75 },
            { date: 'Fri', sessions: 30, score: 78 },
          ]
          setData({ ...stats, trend: mockTrend })
        }
      } catch (err) {
        console.error('Failed to fetch admin analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 text-left font-jakarta">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Platform Intelligence</h1>
        <p className="text-[#7B6F63] font-medium text-base">Global performance audit and operational efficiency mapping.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Global Proficiency" value={`${data?.avg_score || 0}%`} icon="📈" />
        <StatCard title="Total Sessions" value={data?.total_sessions || 0} icon="🎯" />
        <StatCard title="Active Managers" value={data?.total_managers || 0} icon="🏢" />
        <StatCard title="Active Reps" value={data?.total_reps || 0} icon="👥" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Session Volume Trend */}
        <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 shadow-sm space-y-10">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.2em]">Session Trajectory</h2>
              <span className="text-[10px] text-[#7D8461] font-black uppercase tracking-widest">+24% Weekly Growth</span>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8CCBC" vertical={false} />
                  <XAxis dataKey="date" stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#F6F1E8', border: '1px solid #D8CCBC', borderRadius: '1.5rem' }} 
                    itemStyle={{ color: '#7D8461', fontWeight: 'bold' }} 
                  />
                  <Line type="monotone" dataKey="sessions" stroke="#7D8461" strokeWidth={4} dot={{ r: 4, fill: '#7D8461', stroke: '#F6F1E8', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Score Distribution */}
        <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 shadow-sm space-y-10">
           <div className="flex justify-between items-center px-2">
              <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.2em]">Proficiency Audit</h2>
              <span className="text-[10px] text-[#7B6F63] font-black uppercase tracking-widest">Platform Average</span>
           </div>
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8CCBC" vertical={false} />
                  <XAxis dataKey="date" stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7B6F63" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#F6F1E8', border: '1px solid #D8CCBC', borderRadius: '1.5rem' }} 
                    itemStyle={{ color: '#A06A5B', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="score" fill="#D6C2A8" radius={[8, 8, 0, 0]}>
                    {data?.trend.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === data.trend.length - 1 ? '#7D8461' : '#D6C2A8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-[#EFE7DC] border border-[#D8CCBC] shadow-sm transition-all hover:shadow-lg">
      <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.3em] mb-4">{title}</p>
      <div className="flex items-end justify-between">
         <h3 className="text-4xl font-extrabold text-[#3A2F28] tracking-tighter leading-none">{value}</h3>
         <span className="text-2xl opacity-30">{icon}</span>
      </div>
    </div>
  )
}
