'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function GlobalSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    setRole(localStorage.getItem('role'))
  }, [])

  const adminItems = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Personnel', href: '/admin/users' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Governance', href: '/admin/settings' },
  ]

  const managerItems = [
    { name: 'Hub', href: '/dashboard' },
    { name: 'Team Force', href: '/manager/reps' },
    { name: 'Intelligence', href: '/manager/analytics' },
    { name: 'Coaching', href: '/manager/coaching' },
  ]

  const repItems = [
    { name: 'Dashboard', href: '/rep/dashboard' },
    { name: 'Training', href: '/rep/train' },
    { name: 'Directives', href: '/rep/coaching' },
  ]

  const navItems = role === 'admin' ? adminItems : role === 'manager' ? managerItems : repItems

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#EAE2D6] border-r border-[#D8CCBC] transition-all duration-300 z-50 flex flex-col font-jakarta ${collapsed ? 'w-20' : 'w-72'}`}
    >
      <div className="p-10 mb-8 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7D8461] rounded-lg flex items-center justify-center text-[#F6F1E8] text-sm font-black shadow-sm">SC</div>
            <span className="text-lg font-extrabold text-[#3A2F28] tracking-tight uppercase">SalesCoach</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center text-[#7B6F63] hover:text-[#3A2F28] hover:bg-[#D8CCBC]/30 rounded-xl transition-all"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 space-y-2">
        {!collapsed ? navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] ${
                isActive 
                  ? 'bg-[#EFE7DC] text-[#7D8461] shadow-sm border border-[#D8CCBC]' 
                  : 'text-[#7B6F63] hover:text-[#3A2F28] hover:bg-[#D8CCBC]/20'
              }`}
            >
              {item.name}
            </Link>
          )
        }) : (
          <div className="flex flex-col items-center gap-6 mt-4">
             {navItems.map((item, i) => (
               <div key={i} className="w-1.5 h-1.5 bg-[#D8CCBC] rounded-full"></div>
             ))}
          </div>
        )}
      </nav>

      <div className="p-8 border-t border-[#D8CCBC]/50">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#EFE7DC]/50 border border-[#D8CCBC]/30">
          <div className="w-10 h-10 bg-[#D6C2A8] rounded-xl flex items-center justify-center text-xs font-black text-[#3A2F28] shadow-sm uppercase">
            {role?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-[#3A2F28] truncate uppercase tracking-widest">{role || 'User'}</p>
              <p className="text-[8px] text-[#7B6F63] font-bold uppercase tracking-[0.2em] mt-1">Authorized Access</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
