'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/rep/dashboard' },
  { name: 'My Training', href: '/rep/train' },
  { name: 'Coaching Notes', href: '/rep/coaching' },
  { name: 'Intelligence Reports', href: '/rep/reports' },
  { name: 'Settings', href: '/rep/settings' },
]

export default function RepSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#EAE2D6] border-r border-[#D8CCBC] transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Brand */}
      <div className="p-10 mb-8 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7D8461] rounded-lg flex items-center justify-center text-[#F6F1E8] text-sm font-black shadow-sm">SC</div>
            <span className="text-lg font-extrabold text-[#3A2F28] tracking-tight uppercase letter-spacing-wide">SalesCoach</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center text-[#7B6F63] hover:text-[#3A2F28] hover:bg-[#D8CCBC]/30 rounded-xl transition-all"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-6 space-y-2">
        {!collapsed ? NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3.5 rounded-2xl transition-all text-xs font-black uppercase tracking-[0.15em] ${
                isActive 
                  ? 'bg-[#EFE7DC] text-[#7D8461] shadow-sm border border-[#D8CCBC]' 
                  : 'text-[#7B6F63] hover:text-[#3A2F28] hover:bg-[#D8CCBC]/20'
              }`}
            >
              {item.name}
            </Link>
          )
        }) : (
          <div className="flex flex-col items-center gap-4">
             {NAV_ITEMS.map((item) => (
               <div key={item.href} className="w-2 h-2 bg-[#D8CCBC] rounded-full"></div>
             ))}
          </div>
        )}
      </nav>

      {/* Profile Mini */}
      <div className="p-8 border-t border-[#D8CCBC]/50">
        {!collapsed ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#EFE7DC]/50 border border-[#D8CCBC]/30">
            <div className="w-10 h-10 bg-[#D6C2A8] rounded-xl flex items-center justify-center text-xs font-black text-[#3A2F28] shadow-sm">R</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-[#3A2F28] truncate uppercase tracking-widest">Representative</p>
              <p className="text-[9px] text-[#7B6F63] font-bold uppercase tracking-[0.2em] mt-1">Performance</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-[#EFE7DC] border border-[#D8CCBC] rounded-xl flex items-center justify-center text-xs font-black text-[#3A2F28] mx-auto">R</div>
        )}
      </div>
    </aside>
  )
}
