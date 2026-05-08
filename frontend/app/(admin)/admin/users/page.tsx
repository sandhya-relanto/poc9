'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ role: '', search: '', approval_status: '' })

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      const query = new URLSearchParams(filter).toString()
      try {
        const res = await fetch(`${API}/api/admin/users?${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) setUsers(await res.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    const delayDebounceFn = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [filter])

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-[#D8CCBC] pb-8">
        <div>
           <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Personnel Directory</h1>
           <p className="text-[#7B6F63] font-medium mt-2">Comprehensive platform user registry and access control.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 p-8 bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2rem]">
        <div className="flex-1 min-w-[200px]">
           <label className="text-[9px] font-black uppercase tracking-widest text-[#7B6F63] mb-2 block ml-1">Search Personnel</label>
           <input 
             type="text" 
             placeholder="Name or email..."
             className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-xl px-5 py-3 text-xs font-bold text-[#3A2F28] outline-none focus:border-[#7D8461]"
             onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
           />
        </div>
        <div className="w-48">
           <label className="text-[9px] font-black uppercase tracking-widest text-[#7B6F63] mb-2 block ml-1">Role Filter</label>
           <select 
             className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-xl px-5 py-3 text-xs font-bold text-[#3A2F28] outline-none"
             onChange={(e) => setFilter(f => ({ ...f, role: e.target.value }))}
           >
              <option value="">All Roles</option>
              <option value="manager">Managers</option>
              <option value="rep">Representatives</option>
              <option value="admin">Admins</option>
           </select>
        </div>
        <div className="w-48">
           <label className="text-[9px] font-black uppercase tracking-widest text-[#7B6F63] mb-2 block ml-1">Status Filter</label>
           <select 
             className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-xl px-5 py-3 text-xs font-bold text-[#3A2F28] outline-none"
             onChange={(e) => setFilter(f => ({ ...f, approval_status: e.target.value }))}
           >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
           </select>
        </div>
      </div>

      <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#D6C2A8]/10 border-b border-[#D8CCBC]/30">
              <tr>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">User Identity</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Role</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Organisation</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em]">Status</th>
                <th className="p-8 text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CCBC]/20">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-[10px] font-black text-[#7B6F63] uppercase tracking-widest">Querying Global Repository...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-[#F6F1E8]/50 transition-all">
                  <td className="p-8">
                    <p className="font-bold text-[#3A2F28] uppercase tracking-tight">{u.name}</p>
                    <p className="text-[10px] text-[#7B6F63] font-bold">{u.email}</p>
                  </td>
                  <td className="p-8">
                    <span className="text-[9px] font-black px-3 py-1 bg-[#D8CCBC]/30 rounded-lg text-[#3A2F28] uppercase tracking-widest">{u.role}</span>
                  </td>
                  <td className="p-8">
                    <p className="text-xs font-bold text-[#3A2F28] uppercase">{u.organisations?.name || 'N/A'}</p>
                  </td>
                  <td className="p-8">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${u.approval_status === 'approved' || !u.approval_status ? 'text-[#7D8461]' : 'text-[#A06A5B]'}`}>
                      {u.approval_status || 'Approved'}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest hover:text-[#7D8461]">Manage →</button>
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
