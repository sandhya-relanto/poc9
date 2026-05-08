'use client'

import { useEffect, useState } from 'react'

export default function AdminSettings() {
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    setAdmin({
      name: localStorage.getItem('name'),
      role: localStorage.getItem('role')
    })
  }, [])

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-[#D8CCBC] pb-8">
        <div>
           <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">System Configuration</h1>
           <p className="text-[#7B6F63] font-medium mt-2">Administrative parameters and security governance.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-8">
         <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm space-y-10">
            <div className="space-y-2">
               <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Identity Matrix</h2>
               <p className="text-xs text-[#7B6F63] font-medium uppercase">Current authorised administrative session</p>
            </div>

            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Name</p>
                  <p className="text-xl font-bold text-[#3A2F28] uppercase">{admin?.name || 'Loading...'}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">Protocol Level</p>
                  <p className="text-xl font-bold text-[#7D8461] uppercase tracking-tighter">Root Administrator</p>
               </div>
            </div>

            <div className="pt-10 border-t border-[#D8CCBC]/50">
               <div className="bg-[#D6C2A8]/20 p-8 rounded-2xl border border-[#D8CCBC]/30">
                  <p className="text-[10px] font-black text-[#3A2F28] uppercase tracking-widest mb-4">Security Advisory</p>
                  <p className="text-sm text-[#7B6F63] font-medium leading-relaxed">
                    To provision additional administrative accounts, utilise the root API endpoint with the verified <code className="bg-[#EFE7DC] px-2 py-1 rounded font-bold">ADMIN_SECRET</code> key. Public admin registration is restricted by platform policy.
                  </p>
               </div>
            </div>
         </section>
      </div>
    </div>
  )
}
