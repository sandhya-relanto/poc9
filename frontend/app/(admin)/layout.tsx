'use client'

import GlobalSidebar from '@/components/GlobalSidebar'
import GlobalTopbar from '@/components/GlobalTopbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#F7F3ED] text-[#3E342B] font-sans">
      <GlobalSidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen transition-all duration-300">
        <GlobalTopbar />
        <main className="p-10 flex-1">
          {children}
        </main>
        
        <footer className="p-10 border-t border-[#D9D0C5] bg-[#EFE7DC]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm font-bold text-[#3E342B] tracking-tight italic uppercase">SalesCoach Intelligence</p>
              <p className="text-[10px] text-[#82786F] font-bold uppercase tracking-widest">Root Administrative Layer</p>
            </div>
            <div className="text-[10px] font-bold text-[#82786F] uppercase tracking-widest">
              &copy; 2026 SalesCoach AI. v2.1.0-ENTERPRISE
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
