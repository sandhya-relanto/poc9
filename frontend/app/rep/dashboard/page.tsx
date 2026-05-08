'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function RepDashboard() {
   const router = useRouter()
   const [loading, setLoading] = useState(true)
   const [repName, setRepName] = useState('')
   const [analytics, setAnalytics] = useState<any>(null)
   const [recentSessions, setRecentSessions] = useState<any[]>([])
   const [assignments, setAssignments] = useState<any[]>([])
   const [notes, setNotes] = useState<any[]>([])
   
   // Dashboard UI States
   const [showMissions, setShowMissions] = useState(true)
   const [showAnalytics, setShowAnalytics] = useState(true)
   const [showHistory, setShowHistory] = useState(false)
   const [showFeedback, setShowFeedback] = useState(true)

   useEffect(() => {
      const fetchData = async () => {
         try {
            const token = localStorage.getItem('token')
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            const [userRes, analyticsRes, assignmentsRes, notesRes, sessionsRes] = await Promise.all([
               fetch(`${API}/api/users/me`, { headers }),
               fetch(`${API}/api/users/my-analytics`, { headers }),
               fetch(`${API}/api/users/my-assignments`, { headers }),
               fetch(`${API}/api/users/my-notes`, { headers }),
               fetch(`${API}/api/sessions/my-sessions`, { headers })
            ])

            if (userRes.ok) {
               const user = await userRes.json()
               setRepName(user.name)
            }
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
            if (assignmentsRes.ok) {
               const data = await assignmentsRes.json()
               setAssignments(data)
            }
            if (notesRes.ok) setNotes(await notesRes.json())
            if (sessionsRes.ok) {
               const sessions = await sessionsRes.json()
               setRecentSessions(sessions.filter((s: any) => s.feedback_json && s.feedback_json.overall_score).slice(0, 5))
            }
         } catch (err) {
            console.error('Failed to fetch data', err)
         } finally {
            setLoading(false)
         }
      }

      fetchData()
   }, [])

   if (loading) {
      return (
         <div className="h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
         </div>
      )
   }

   const activeAssignments = assignments.filter(a => a.status !== 'Completed')
   const currentMission = activeAssignments[0] // Highest priority / most recent

   return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 md:px-0">
         
         {/* SECTION 1: COMPACT HERO HEADER */}
         <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="flex-1 space-y-1">
               <h1 className="text-3xl font-black text-[#3A2F28] tracking-tight">Bonjour, {repName.split(' ')[0]} 👋</h1>
               <div className="flex items-center gap-4 text-[#7B6F63]">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest">Readiness Score</span>
                     <span className="text-2xl font-black text-[#7D8461]">{analytics?.avgScore || 0}%</span>
                  </div>
                  <span className="h-4 w-[1px] bg-[#D8CCBC]"></span>
                  <p className="text-sm font-medium">Focused & ready for your next drill.</p>
               </div>
            </div>

            {currentMission && (
               <div className="bg-white/50 border border-[#D8CCBC]/50 rounded-3xl p-6 flex items-center gap-6 shadow-inner">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-[#7D8461] uppercase tracking-[0.2em]">CURRENT MISSION</p>
                     <h3 className="text-base font-bold text-[#3A2F28] truncate max-w-[200px]">{currentMission.scenario_name}</h3>
                     <p className="text-[10px] text-[#7B6F63] font-bold">Attempt {currentMission.attempts_used + 1} of 3</p>
                  </div>
                  <button 
                     onClick={() => router.push(`/rep/train/${currentMission.scenario_id}/briefing?assignmentId=${currentMission.id}`)}
                     className="bg-[#7D8461] hover:bg-[#6B7252] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shrink-0"
                  >
                     Resume Mission
                  </button>
               </div>
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* CENTER COLUMN: MISSIONS + FOCUS + PERFORMANCE */}
            <div className="lg:col-span-8 space-y-10">
               
               {/* SECTION 2: ACTIVE MISSIONS */}
               <section className="space-y-6">
                  <div 
                     className="flex justify-between items-center px-2 cursor-pointer group"
                     onClick={() => setShowMissions(!showMissions)}
                  >
                     <h2 className="text-[11px] font-black text-[#3A2F28] uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className={`transition-transform duration-300 ${showMissions ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                        Active Missions
                     </h2>
                     <span className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest group-hover:text-[#7D8461] transition-colors">
                        {activeAssignments.length} DEPLOYED
                     </span>
                  </div>

                  {showMissions && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {activeAssignments.length === 0 ? (
                           <div className="bg-white border-2 border-dashed border-[#D8CCBC] rounded-[2rem] p-16 text-center">
                              <p className="text-[#7B6F63] font-black uppercase tracking-widest text-[10px]">No active missions assigned.</p>
                           </div>
                        ) : (
                           activeAssignments.map((assign) => (
                              <div key={assign.id} className="bg-white border border-[#D8CCBC] rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center hover:shadow-xl transition-all group relative overflow-hidden">
                                 {/* Status Indicator Bar */}
                                 <div className={`absolute left-0 top-0 bottom-0 w-2 ${assign.status === 'Overdue' ? 'bg-[#A06A5B]' : 'bg-[#7D8461]'}`}></div>
                                 
                                 <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                          assign.status === 'Overdue' 
                                             ? 'bg-[#A06A5B]/10 text-[#A06A5B] border-[#A06A5B]/20' 
                                             : 'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20'
                                       }`}>
                                          {assign.status}
                                       </span>
                                       <span className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">
                                          {assign.scenario?.persona_type || 'EXECUTIVE BUYER'} • {assign.scenario?.difficulty || 'Intermediate'}
                                       </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[#3A2F28] leading-tight">{assign.scenario_name}</h3>
                                    <div className="flex items-center gap-8">
                                       <div>
                                          <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest mb-1">ATTEMPTS</p>
                                          <p className="text-xs font-bold text-[#3A2F28]">{assign.attempts_used}/3</p>
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest mb-1">BEST SCORE</p>
                                          <p className="text-xs font-bold text-[#3A2F28]">{assign.score || 0}%</p>
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest mb-1">DEADLINE</p>
                                          <p className="text-xs font-bold text-[#3A2F28]">{new Date(assign.deadline).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <button 
                                       onClick={() => router.push(`/rep/train/${assign.scenario_id}/briefing?assignmentId=${assign.id}`)}
                                       className="bg-[#7D8461] hover:bg-[#6B7252] text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md whitespace-nowrap"
                                    >
                                       {assign.attempts_used > 0 ? 'Continue Simulation' : 'Start Simulation'}
                                    </button>
                                    <Link 
                                       href={`/rep/train/${assign.scenario_id}/review?sessionId=${assign.session_id}`}
                                       className="text-center text-[9px] font-black text-[#7B6F63] hover:text-[#7D8461] uppercase tracking-widest transition-colors"
                                    >
                                       View Last Briefing →
                                    </Link>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  )}
               </section>

               {/* SECTION 3: TODAY'S FOCUS (PERSONALIZED COACHING) */}
               <section className="bg-[#7D8461] rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg shadow-[#7D8461]/10">
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <span className="text-2xl">🎯</span>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">Today's Focus</h2>
                     </div>
                     <h3 className="text-3xl font-black tracking-tight">Improve {analytics?.weakestSkill || 'Discovery Skills'}</h3>
                     <p className="text-white/70 font-medium max-w-md">Your last few sessions showed room for growth in this area. We've prepared a specific drill to help you optimize.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[2rem] p-8 flex flex-col items-center gap-4 text-center">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-60">RECOMMENDED DRILL</p>
                     <p className="text-lg font-bold">Executive Negotiation Practice</p>
                     <button className="bg-white text-[#7D8461] px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F6F1E8] transition-all shadow-xl">
                        Start Drill
                     </button>
                  </div>
               </section>

               {/* SECTION 4: PERFORMANCE SNAPSHOT */}
               <section className="space-y-6">
                  <div 
                     className="flex justify-between items-center px-2 cursor-pointer group"
                     onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                     <h2 className="text-[11px] font-black text-[#3A2F28] uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className={`transition-transform duration-300 ${showAnalytics ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                        Performance Snapshot
                     </h2>
                     <Link href="/rep/performance" className="text-[9px] font-black text-[#7D8461] uppercase tracking-widest hover:underline">Full Analytics →</Link>
                  </div>

                  {showAnalytics && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-white border border-[#D8CCBC] rounded-[2rem] p-8 space-y-4">
                           <p className="text-[9px] font-black text-[#7D8461] uppercase tracking-[0.2em]">READINESS SCORE</p>
                           <div className="flex items-end gap-2">
                              <span className="text-5xl font-black text-[#3A2F28] tracking-tighter">{analytics?.avgScore || 0}%</span>
                              <span className="text-[10px] font-black text-[#7D8461] mb-2 uppercase">↑ {Math.abs(analytics?.trendValue || 0)}%</span>
                           </div>
                        </div>
                        <div className="bg-white border border-[#D8CCBC] rounded-[2rem] p-8 space-y-4">
                           <p className="text-[9px] font-black text-[#7D8461] uppercase tracking-[0.2em]">TOP SKILL</p>
                           <h4 className="text-2xl font-black text-[#3A2F28] truncate">{analytics?.strongestSkill || 'Discovery'}</h4>
                           <p className="text-[10px] font-bold text-[#7B6F63] uppercase tracking-widest">Mastery level reached</p>
                        </div>
                        <div className="bg-white border border-[#D8CCBC] rounded-[2rem] p-8 space-y-4">
                           <p className="text-[9px] font-black text-[#A06A5B] uppercase tracking-[0.2em]">NEEDS IMPROVEMENT</p>
                           <h4 className="text-2xl font-black text-[#3A2F28] truncate">{analytics?.weakestSkill || 'Closing'}</h4>
                           <p className="text-[10px] font-bold text-[#A06A5B] uppercase tracking-widest">Priority for practice</p>
                        </div>
                     </div>
                  )}
               </section>

               {/* SECTION 5: RECENT PERFORMANCE TIMELINE */}
               <section className="space-y-6">
                  <div 
                     className="flex justify-between items-center px-2 cursor-pointer group"
                     onClick={() => setShowHistory(!showHistory)}
                  >
                     <h2 className="text-[11px] font-black text-[#3A2F28] uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className={`transition-transform duration-300 ${showHistory ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                        Mission History
                     </h2>
                  </div>

                  {showHistory && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {recentSessions.length === 0 ? (
                           <div className="bg-white/50 border border-dashed border-[#D8CCBC] rounded-[2rem] p-10 text-center">
                              <p className="text-[#7B6F63] font-bold text-[10px] uppercase tracking-widest">No recent activity found.</p>
                           </div>
                        ) : (
                           recentSessions.map((session) => (
                              <div key={session.id} className="bg-white border border-[#D8CCBC] rounded-2xl p-6 flex items-center justify-between hover:border-[#7D8461] transition-all cursor-pointer"
                                 onClick={() => router.push(`/rep/train/${session.scenario_id}/review?sessionId=${session.id}`)}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#7D8461]/10 flex items-center justify-center text-[#7D8461]">
                                       ✔
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-bold text-[#3A2F28]">{session.scenario_name}</h4>
                                       <p className="text-[10px] text-[#7B6F63] font-medium">Completed {new Date(session.completed_at).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-lg font-black text-[#7D8461]">{session.feedback_json?.overall_score || 0}%</p>
                                    <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">SCORE</p>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  )}
               </section>
            </div>

            {/* RIGHT COLUMN: MANAGER NOTES + QUICK STATS */}
            <div className="lg:col-span-4 space-y-10">
               
               {/* SECTION 6: MANAGER FEEDBACK */}
               <section className="space-y-6">
                  <div 
                     className="flex justify-between items-center px-2 cursor-pointer group"
                     onClick={() => setShowFeedback(!showFeedback)}
                  >
                     <h2 className="text-[11px] font-black text-[#3A2F28] uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className={`transition-transform duration-300 ${showFeedback ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                        Coaching Notes
                     </h2>
                     <span className="bg-[#7D8461] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{notes.length}</span>
                  </div>

                  {showFeedback && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {notes.length === 0 ? (
                           <div className="bg-white/50 border border-dashed border-[#D8CCBC] rounded-[2rem] p-10 text-center">
                              <p className="text-[#7B6F63] font-bold text-[10px] uppercase tracking-widest">No feedback from management yet.</p>
                           </div>
                        ) : (
                           notes.slice(0, 4).map((note) => (
                              <div key={note.id} className="bg-white border border-[#D8CCBC] rounded-2xl p-6 space-y-4 hover:shadow-md transition-all group">
                                 <p className="text-sm font-medium text-[#3A2F28] italic leading-relaxed">
                                    "{note.note_text.length > 100 ? note.note_text.substring(0, 100) + '...' : note.note_text}"
                                 </p>
                                 <div className="flex justify-between items-center pt-4 border-t border-[#F6F1E8]">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-[#EFE7DC] flex items-center justify-center text-[10px]">👤</div>
                                       <p className="text-[10px] font-black text-[#7D8461] uppercase tracking-widest">{note.manager_name}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           ))
                        )}
                        <Link href="/rep/coaching" className="block text-center text-[9px] font-black text-[#7B6F63] hover:text-[#3A2F28] uppercase tracking-widest mt-4">View All Coaching →</Link>
                     </div>
                  )}
               </section>

               {/* QUICK STATS / ACTIVITY FEED */}
               <section className="bg-white border border-[#D8CCBC] rounded-[2.5rem] p-8 space-y-8">
                  <h2 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Recent Activity</h2>
                  <div className="space-y-6 relative pl-4">
                     <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#F6F1E8]"></div>
                     
                     {[
                        { title: 'Training Milestone', desc: '5 sessions completed this week', icon: '🏆' },
                        { title: 'Skill Boost', desc: 'Discovery score increased by 4%', icon: '📈' },
                        { title: 'New Mission', desc: 'Enterprise CFO Negotiation added', icon: '🆕' }
                     ].map((item, i) => (
                        <div key={i} className="relative flex gap-4 items-start">
                           <div className="w-4 h-4 rounded-full bg-white border-2 border-[#7D8461] z-10 shrink-0 mt-1"></div>
                           <div>
                              <p className="text-xs font-bold text-[#3A2F28]">{item.title}</p>
                              <p className="text-[10px] text-[#7B6F63] font-medium">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

            </div>
         </div>
      </div>
   )
}
