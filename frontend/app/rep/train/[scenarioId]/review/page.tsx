'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SessionReviewPage({ params }: { params: { scenarioId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'skills' | 'objections'>('overview')

  useEffect(() => {
    if (!sessionId) {
      router.push('/rep/reports')
      return
    }

    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API}/api/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        } else {
          router.push('/rep/reports')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
      </div>
    )
  }

  const feedback = session.feedback_json || {}
  const scenario = session.training_scenarios || {}
  const messages = session.messages_json || []
  const score = feedback.overall_score || 0

  const getOutcome = (s: number) => {
    if (s >= 85) return { label: 'Highly Effective', color: 'text-[#7D8461]', bg: 'bg-[#7D8461]/10' }
    if (s >= 70) return { label: 'Effective', color: 'text-[#7D8461]', bg: 'bg-[#7D8461]/5' }
    if (s >= 50) return { label: 'Needs Improvement', color: 'text-[#3A2F28]', bg: 'bg-[#D6C2A8]/20' }
    return { label: 'Focus Area', color: 'text-[#A06A5B]', bg: 'bg-[#A06A5B]/10' }
  }
  
  const displayScore = (val: number | null | undefined) => {
    const safeVal = val ?? 0
    const raw = (safeVal / 100) * 5
    return `${raw.toFixed(1)}/5 (${safeVal}%)`
  }
  
  const outcome = getOutcome(score)

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 text-left">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/rep/reports" className="text-[#7D8461] hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          &larr; Back to Intelligence Repository
        </Link>
        <div className="text-[#7B6F63] text-[9px] font-black uppercase tracking-widest">
          Report ID: {sessionId?.substring(0, 12)}
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 md:p-12 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-[#F6F1E8] text-[#7D8461] text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-[#D8CCBC]">
                {scenario.difficulty || 'Professional'}
              </span>
              <span className="text-[#D8CCBC]">|</span>
              <span className="text-[#7B6F63] text-[10px] font-bold uppercase tracking-widest">{new Date(session.completed_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight leading-tight">
              {scenario.persona_name || 'Strategic Interaction'}
            </h1>
            <p className="text-[#7B6F63] text-base leading-relaxed">
              Tactical review of the interaction with <span className="text-[#3A2F28] font-bold">{scenario.persona_name}</span>. 
              {feedback.summary?.split('.')[0]}.
            </p>
          </div>

          <div className="flex items-center gap-8 bg-[#F6F1E8] p-8 rounded-[2rem] border border-[#D8CCBC] shadow-inner">
            <div className="text-center">
              <div className={`text-6xl font-black ${outcome.color} tracking-tighter`}>
                {displayScore(score)}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#7B6F63] mt-2">Overall Proficiency</div>
            </div>
            <div className={`px-6 py-3 rounded-2xl border ${outcome.bg} ${outcome.color} text-xs font-black uppercase tracking-widest`}>
              {outcome.label}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#EAE2D6] border border-[#D8CCBC] rounded-[1.5rem] p-1.5 gap-2 w-fit">
        {[
          { id: 'overview', label: 'Analysis Overview' },
          { id: 'transcript', label: 'Tactical Replay' },
          { id: 'skills', label: 'Proficiency Matrix' },
          { id: 'objections', label: 'Objection Handling' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-[#EFE7DC] text-[#7D8461] shadow-sm border border-[#D8CCBC]' 
                : 'text-[#7B6F63] hover:text-[#3A2F28]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-12">
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                {/* 1. Overall Score Hero */}
                <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 shadow-sm">
                  <div className="flex items-center gap-8 bg-[#F6F1E8] p-8 rounded-[2rem] border border-[#D8CCBC] shadow-inner">
                    <div className="text-center">
                      <div className={`text-6xl font-black ${outcome.color} tracking-tighter`}>
                        {displayScore(score)}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#7B6F63] mt-2">Overall Proficiency</div>
                    </div>
                    <div className="h-16 w-px bg-[#D8CCBC]"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${outcome.bg} ${outcome.color}`}>
                          {outcome.label}
                        </span>
                      </div>
                      <p className="text-[#3A2F28] font-medium leading-relaxed">
                        {feedback.summary || "Awaiting final analysis results..."}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. Objective Metrics Table */}
                <section className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Objective Performance Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Talk Ratio', val: feedback.metrics?.talk_ratio || 'Insufficient Data', icon: '🗣️' },
                      { label: 'Question Rate', val: feedback.metrics?.question_rate || 'Insufficient Data', icon: '❓' },
                      { label: 'Avg Length', val: feedback.metrics?.avg_response_length ? `${feedback.metrics.avg_response_length}` : 'Insufficient Data', icon: '📏' },
                      { label: 'Energy Level', val: feedback.scores?.energy ? `${feedback.scores.energy}%` : 'Insufficient Data', icon: '⚡' }
                    ].map(m => (
                      <div key={m.label} className="bg-[#F6F1E8] p-6 rounded-2xl border border-[#D8CCBC]/50 flex flex-col items-center text-center">
                        <span className="text-xl mb-2">{m.icon}</span>
                        <p className="text-[8px] font-black text-[#7B6F63] uppercase tracking-tighter mb-1">{m.label}</p>
                        <p className="text-sm font-bold text-[#3A2F28]">{m.val}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. AI Coaching Cards Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { title: 'Opening Effectiveness', score: feedback.scores?.opening, tip: feedback.detailed_insights?.opening_tip || 'Refine your agenda setting strategy.' },
                    { title: 'Discovery Quality', score: feedback.scores?.discovery, tip: feedback.detailed_insights?.discovery_tip || 'Practice more open-ended strategic questioning.' },
                    { title: 'Objection Handling', score: feedback.scores?.objection_handling, tip: feedback.detailed_insights?.objection_tip || 'Strengthen your ROI-backed proof points.' },
                    { title: 'Closing Strength', score: feedback.scores?.closing, tip: feedback.detailed_insights?.closing_tip || 'Ensure every call ends with a firm next step.' }
                  ].map(card => (
                    <div key={card.title} className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2rem] p-8 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-widest">{card.title}</h4>
                        <span className="text-lg font-black text-[#7D8461]">{card.score ?? 0}%</span>
                      </div>
                      <div className="w-full bg-[#EAE2D6] h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7D8461]" style={{ width: `${card.score ?? 0}%` }} />
                      </div>
                      <p className="text-[9px] text-[#7B6F63] font-medium leading-relaxed italic">Coach Directive: {card.tip}</p>
                    </div>
                  ))}
                </section>

                {/* 4-10 Detailed Insights */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em] px-4">Detailed Performance Audit</h3>
                  
                  <InsightCard title="What Went Well" content={feedback.detailed_insights?.what_went_well} icon="✅" color="text-[#7D8461]" />
                  <InsightCard title="Critical Mistakes" content={feedback.detailed_insights?.critical_mistakes} icon="⚠️" color="text-[#A06A5B]" alert />
                  <InsightCard title="Missed Opportunities" content={feedback.detailed_insights?.missed_opportunities} icon="🔍" color="text-[#D6C2A8]" />
                  <InsightCard title="Suggested Better Responses" content={feedback.detailed_insights?.suggested_responses} icon="✍️" />
                  <InsightCard title="Persona Reaction Analysis" content={feedback.detailed_insights?.customer_reaction_analysis} icon="👤" />

                  {/* 9. Readiness Level */}
                  <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[1.5rem] p-6 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xl">🎓</span>
                      <div>
                        <h4 className="text-[9px] font-black text-[#3A2F28] uppercase tracking-widest">Market Readiness Level</h4>
                        <p className="text-sm text-[#7B6F63] font-medium">Current competency for this persona type</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#3A2F28]">{score >= 80 ? 'Certified' : 'In Training'}</p>
                      <p className="text-[8px] font-black text-[#7D8461] uppercase tracking-widest">{score >= 80 ? 'High Proficiency' : 'Needs Optimization'}</p>
                    </div>
                  </div>

                  {/* 10. Next Coaching Priority */}
                  <div className="bg-[#3A2F28] text-[#F6F1E8] rounded-[2rem] p-10 space-y-4 shadow-xl">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">🎯</span>
                      <h4 className="text-xs font-black uppercase tracking-[0.3em]">Immediate Coaching Priority</h4>
                    </div>
                    <p className="text-lg font-medium leading-relaxed italic">
                      "{feedback.next_practice_recommendation || "Maintain current training frequency and focus on discovery depth."}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-10 shadow-sm">
                  <div>
                    <h4 className="text-[9px] font-black text-[#7D8461] uppercase tracking-widest mb-6">Tactical Strengths</h4>
                    <ul className="space-y-4">
                      {(feedback.strengths || []).map((s: string, i: number) => (
                        <li key={i} className="flex gap-4 text-sm text-[#3A2F28] font-bold uppercase tracking-tight items-start">
                          <span className="text-[#7D8461]">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-10 border-t border-[#D8CCBC]/50">
                    <h4 className="text-[9px] font-black text-[#A06A5B] uppercase tracking-widest mb-6">Optimization Focus</h4>
                    <ul className="space-y-4">
                      {(feedback.improvements || []).map((s: string, i: number) => (
                        <li key={i} className="flex gap-4 text-sm text-[#3A2F28] font-bold uppercase tracking-tight items-start">
                          <span className="text-[#A06A5B]">!</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#7D8461] rounded-[2.5rem] p-10 shadow-lg shadow-[#7D8461]/20">
                  <h4 className="text-[#F6F1E8]/70 text-[9px] font-black uppercase tracking-widest mb-4">Recommended Module</h4>
                  <p className="text-[#F6F1E8] font-bold text-2xl mb-8 tracking-tight leading-tight">{feedback.next_practice_recommendation || "Strategic Closing Dynamics"}</p>
                  <Link href="/rep/train" className="block w-full py-5 bg-[#F6F1E8] text-[#7D8461] text-center font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#EAE2D6] transition-all">
                    Authorize Mission →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 md:p-16 space-y-12 shadow-sm max-h-[800px] overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-12">
              {messages.map((m: any, i: number) => {
                const isUser = m.role === 'user'
                const highlight = feedback.highlights?.find((h: any) => h.rep_quote === m.content)
                
                return (
                  <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-4 mb-3 px-4">
                       <span className="text-[9px] text-[#7B6F63] font-black uppercase tracking-[0.2em]">
                         {isUser ? 'You' : (scenario.persona_name || 'Target')}
                       </span>
                       {highlight && (
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                           highlight.type === 'strong' ? 'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20' : 'bg-[#A06A5B]/10 text-[#A06A5B] border-[#A06A5B]/20'
                         }`}>
                           AI {highlight.type}
                         </span>
                       )}
                    </div>
                    <div className={`max-w-[85%] rounded-[2rem] px-8 py-5 text-base leading-relaxed shadow-sm font-medium ${
                      isUser 
                        ? `bg-[#7D8461] text-[#F6F1E8] rounded-tr-none ${highlight?.type === 'weak' ? 'border-4 border-[#A06A5B]/40' : ''}` 
                        : 'bg-[#F6F1E8] text-[#3A2F28] border border-[#D8CCBC] rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                    {highlight && highlight.type === 'weak' && (
                      <div className="mt-4 w-full max-w-[80%] bg-[#F6F1E8] border border-[#D8CCBC] p-6 rounded-2xl shadow-sm">
                         <p className="text-[9px] text-[#A06A5B] font-black uppercase tracking-widest mb-2">Tactical Correction</p>
                         <p className="text-[#3A2F28] text-sm italic font-medium">“{highlight.suggestion}”</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 space-y-10 shadow-sm">
                <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Proficiency Distribution</h3>
                <div className="space-y-8">
                  {Object.entries(feedback.scores || {}).map(([key, val]: [string, any]) => (
                    <div key={key}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                        <span className="text-[#7B6F63]">{key.replace('_', ' ')}</span>
                        <span className={val >= 75 ? 'text-[#7D8461]' : 'text-[#3A2F28]'}>{val}%</span>
                      </div>
                      <div className="w-full bg-[#EAE2D6] h-3 rounded-full overflow-hidden border border-[#D8CCBC]/30">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            val >= 75 ? 'bg-[#7D8461]' : 'bg-[#D6C2A8]'
                          }`}
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 space-y-10 shadow-sm">
                <h3 className="text-[10px] font-black text-[#3A2F28] uppercase tracking-[0.3em]">Reaction Dynamics</h3>
                <div className="space-y-6">
                  {feedback.emotional_tracking?.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-6 p-6 bg-[#F6F1E8] rounded-2xl border border-[#D8CCBC]/50 shadow-sm">
                       <div className="w-14 h-14 rounded-2xl bg-[#EAE2D6] flex items-center justify-center text-2xl shadow-inner border border-[#D8CCBC]/30">
                         {e.customer_reaction.includes('frustrated') || e.customer_reaction.includes('annoyed') ? '😤' : 
                          e.customer_reaction.includes('engaged') || e.customer_reaction.includes('trusting') ? '🤝' : '👤'}
                       </div>
                       <div>
                         <p className="text-[9px] text-[#7B6F63] font-black uppercase tracking-widest mb-1">{e.moment}</p>
                         <p className="text-base text-[#3A2F28] font-bold">Target felt <span className="text-[#7D8461]">{e.customer_reaction}</span></p>
                       </div>
                    </div>
                  ))}
                  {(!feedback.emotional_tracking || feedback.emotional_tracking.length === 0) && (
                    <p className="text-[#7B6F63] text-sm text-center font-medium italic">Reaction data unavailable.</p>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'objections' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {feedback.objections_analysis?.map((o: any, i: number) => (
               <div key={i} className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-10 space-y-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                       o.is_effective ? 'bg-[#7D8461]/10 text-[#7D8461] border-[#7D8461]/20' : 'bg-[#A06A5B]/10 text-[#A06A5B] border-[#A06A5B]/20'
                     }`}>
                       {o.is_effective ? 'Successfully Neutralized' : 'Tactical Friction'}
                     </span>
                  </div>
                  <h4 className="text-xl font-bold text-[#3A2F28] leading-tight uppercase tracking-tight">{o.objection}</h4>
                  <div className="space-y-6 pt-6 border-t border-[#D8CCBC]/50">
                     <div>
                       <p className="text-[9px] text-[#7B6F63] font-black uppercase tracking-widest mb-3">Counter Response</p>
                       <p className="text-base text-[#3A2F28] italic font-medium leading-relaxed">“{o.rep_response}”</p>
                     </div>
                     <div className="bg-[#F6F1E8] p-6 rounded-2xl border border-[#D8CCBC]/50 shadow-inner">
                        <p className="text-[9px] text-[#7D8461] font-black uppercase tracking-widest mb-2">Tactical Feedback</p>
                        <p className="text-sm text-[#7B6F63] font-medium leading-relaxed">{o.feedback}</p>
                     </div>
                  </div>
               </div>
             ))}
             {(!feedback.objections_analysis || feedback.objections_analysis.length === 0) && (
               <div className="md:col-span-2 bg-[#EFE7DC] border border-dashed border-[#D8CCBC] rounded-[2.5rem] p-24 text-center">
                  <p className="text-[#7B6F63] font-black uppercase tracking-[0.2em] text-[10px]">No critical objections detected.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}

function InsightCard({ title, content, icon, color = 'text-[#3A2F28]', alert = false }: any) {
  if (!content || content === 'null' || content === 'undefined') return null
  
  return (
    <div className={`bg-[#F6F1E8] border border-[#D8CCBC]/50 rounded-[1.5rem] p-6 shadow-sm transition-all hover:shadow-md ${alert ? 'border-[#A06A5B]/30' : ''}`}>
       <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">{icon}</span>
          <h4 className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{title}</h4>
       </div>
       <p className="text-sm text-[#3A2F28] leading-relaxed font-medium">
          {content}
       </p>
    </div>
  )
}
