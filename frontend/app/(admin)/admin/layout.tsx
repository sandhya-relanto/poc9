'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')
    if (role !== 'admin') {
      router.push('/login')
    }
    setUserName(name || 'Admin')
  }, [])

  const navItems = [
    { name: 'Overview', href: '/admin/dashboard', icon: '📊' },
    { name: 'Approvals', href: '/admin/approvals', icon: '⚖️' },
    { name: 'Managers', href: '/admin/managers', icon: '🏢' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ]

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#F6F1E8]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#EAE2D6] border-r border-[#D8CCBC] flex flex-col sticky top-0 h-screen">
        <div className="p-10 mb-8">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-extrabold text-[#3A2F28] tracking-tighter uppercase">SALESCOACH</h2>
             <span className="px-2 py-0.5 bg-[#A06A5B] text-[#F6F1E8] text-[8px] font-black rounded uppercase tracking-tighter">ADMIN</span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em] ${
                  isActive 
                    ? 'bg-[#F6F1E8] text-[#7D8461] shadow-sm border border-[#D8CCBC]' 
                    : 'text-[#7B6F63] hover:text-[#3A2F28] hover:bg-[#D8CCBC]/20'
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-8 border-t border-[#D8CCBC]/50">
          <div className="flex items-center gap-4 mb-6 px-4">
             <div className="w-10 h-10 bg-[#7D8461] rounded-xl flex items-center justify-center text-[#F6F1E8] font-black text-xs uppercase">
                {userName.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] font-black text-[#3A2F28] truncate uppercase tracking-widest">{userName}</p>
                <p className="text-[8px] text-[#7B6F63] font-bold uppercase tracking-[0.2em]">Root Access</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-4 text-[10px] font-black text-[#A06A5B] uppercase tracking-widest hover:bg-[#A06A5B]/10 rounded-2xl transition-all"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  )
}
