'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TeamPage() {
  const [reps, setReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await fetch(`${API}/api/users/reps`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setReps(data)
        }
      } catch (err) {
        console.error('Failed to fetch team members', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredReps = useMemo(() => {
    let result = [...reps]
    if (searchTerm) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter)
    }
    return result
  }, [reps, searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Force Intelligence</h1>
          <p className="text-[#7B6F63] font-medium text-base mt-2">Representative Oversight & Personnel Directory</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-72">
              <input 
                type="text" 
                placeholder="Search Personnel..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl py-4 px-6 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all placeholder:text-[#7B6F63]/50"
              />
           </div>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-2xl py-4 px-8 text-[10px] font-black uppercase tracking-widest text-[#3A2F28] outline-none focus:border-[#7D8461] appearance-none"
           >
              <option value="All">All Personnel</option>
              <option value="Active">Operational</option>
              <option value="At Risk">Risk Identified</option>
              <option value="New">Initialized</option>
           </select>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredReps.map((rep) => (
          <div key={rep.id} className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 hover:shadow-xl transition-all group relative overflow-hidden">
             {/* Status Badge */}
             <div className="absolute top-10 right-10">
                <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                  rep.status === 'At Risk' ? 'bg-[#A06A5B]/10 text-[#A06A5B] border-[#A06A5B]/20' :
                  rep.status === 'New' ? 'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20' :
                  'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20'
                }`}>
                  {rep.status || 'Active'}
                </span>
             </div>

             <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-[#F6F1E8] border border-[#D8CCBC] rounded-[2rem] flex items-center justify-center text-2xl font-black text-[#7D8461] shadow-sm group-hover:scale-105 transition-transform">
                   {rep.name.charAt(0)}
                </div>
                <div>
                   <h3 className="text-2xl font-extrabold text-[#3A2F28] tracking-tight uppercase">{rep.name}</h3>
                   <p className="text-[10px] text-[#7B6F63] font-black uppercase tracking-widest mt-1">{rep.email}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-[#F6F1E8] p-5 rounded-2xl border border-[#D8CCBC]">
                   <p className="text-[9px] font-black text-[#D8CCBC] uppercase mb-1 tracking-widest">Proficiency</p>
                   <p className="text-2xl font-extrabold text-[#7D8461] tracking-tighter">{rep.overall_score}%</p>
                </div>
                <div className="bg-[#F6F1E8] p-5 rounded-2xl border border-[#D8CCBC] text-right">
                   <p className="text-[9px] font-black text-[#D8CCBC] uppercase mb-1 tracking-widest">Sessions</p>
                   <p className="text-2xl font-extrabold text-[#3A2F28] tracking-tighter">{rep.session_count}</p>
                </div>
             </div>

             <div className="space-y-5 mb-12">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-[#7B6F63]">Primary Skill</span>
                   <span className="text-[#7D8461]">{rep.strongest_skill}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-[#7B6F63]">Growth Area</span>
                   <span className="text-[#A06A5B]">{rep.weakest_skill}</span>
                </div>
             </div>

             <Link 
               href={`/reps/${rep.id}`}
               className="w-full py-5 bg-[#EAE2D6] hover:bg-[#D8CCBC] text-[#3A2F28] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-[#D8CCBC] transition-all flex items-center justify-center"
             >
                Intelligence Profile
             </Link>
          </div>
        ))}
        
        {filteredReps.length === 0 && (
          <div className="col-span-full py-48 text-center">
            <p className="text-[10px] font-black text-[#7B6F63] uppercase tracking-[0.3em]">No agents match criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
