'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function NewScenarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    persona_name: '',
    persona_type: 'Skeptical CFO',
    difficulty: 'beginner',
    context_text: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create scenario')
      }

      router.push('/scenarios')
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <Link href="/scenarios" className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7B6F63] hover:text-[#3A2F28] transition-colors mb-4 block">
            Back to Scenarios
          </Link>
          <h1 className="text-4xl font-extrabold text-[#3A2F28] tracking-tight">Create Scenario</h1>
          <p className="text-[#7B6F63] font-medium text-base mt-2">Design an AI persona for representative operational training.</p>
        </div>
      </div>

      <div className="bg-[#EFE7DC] border border-[#D8CCBC] rounded-[2.5rem] p-12 shadow-sm">
        {error && (
          <div className="mb-10 p-6 bg-[#A06A5B]/10 border border-[#A06A5B]/20 text-[#A06A5B] rounded-2xl text-[10px] font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Persona Name */}
          <div className="space-y-4">
            <label htmlFor="persona_name" className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">
              Persona Name
            </label>
            <input
              id="persona_name"
              type="text"
              required
              placeholder="e.g. John Smith"
              value={formData.persona_name}
              onChange={(e) => setFormData({ ...formData, persona_name: e.target.value })}
              className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] placeholder:text-[#7B6F63]/30 focus:border-[#7D8461] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Persona Type */}
            <div className="space-y-4">
              <label htmlFor="persona_type" className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">
                Persona Type
              </label>
              <select
                id="persona_type"
                value={formData.persona_type}
                onChange={(e) => setFormData({ ...formData, persona_type: e.target.value })}
                className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all appearance-none"
              >
                <option value="Skeptical CFO">Skeptical CFO</option>
                <option value="Friendly Champion">Friendly Champion</option>
                <option value="Technical Evaluator">Technical Evaluator</option>
                <option value="Gatekeeper">Gatekeeper</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-4">
              <label htmlFor="difficulty" className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all appearance-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* New Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Target Skills</label>
               <input
                 type="text"
                 placeholder="e.g. Discovery, Objection Handling"
                 value={(formData as any).target_skills || ''}
                 onChange={(e) => setFormData({ ...formData, target_skills: e.target.value } as any)}
                 className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all"
               />
             </div>
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Evaluation Focus (comma separated)</label>
               <input
                 type="text"
                 placeholder="e.g. rapport, discovery, closing"
                 value={(formData as any).evaluation_focus || ''}
                 onChange={(e) => setFormData({ ...formData, evaluation_focus: e.target.value } as any)}
                 className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all"
               />
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Objection Protocol</label>
             <input
               type="text"
               placeholder="How should the persona react to objections?"
               value={(formData as any).objection_style || ''}
               onChange={(e) => setFormData({ ...formData, objection_style: e.target.value } as any)}
               className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-bold text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all"
             />
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">Personality Traits</label>
             <textarea
               rows={3}
               placeholder="e.g. Analytical, skeptical of new tech, very direct..."
               value={(formData as any).personality_traits || ''}
               onChange={(e) => setFormData({ ...formData, personality_traits: e.target.value } as any)}
               className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-4 text-sm font-medium text-[#3A2F28] focus:border-[#7D8461] outline-none transition-all resize-none"
             />
          </div>

          {/* Context Text */}
          <div className="space-y-4">
            <label htmlFor="context_text" className="text-[10px] font-black uppercase text-[#7B6F63] tracking-widest ml-1">
              Scenario Context & Background
            </label>
            <textarea
              id="context_text"
              required
              rows={6}
              placeholder="Describe the company, the prospect's current situation, their budget constraints, and what the rep should try to achieve in this call..."
              value={formData.context_text}
              onChange={(e) => setFormData({ ...formData, context_text: e.target.value })}
              className="w-full bg-[#F6F1E8] border border-[#D8CCBC] rounded-2xl px-8 py-6 text-sm font-medium text-[#3A2F28] placeholder:text-[#7B6F63]/30 focus:border-[#7D8461] outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-8 flex justify-end gap-6">
            <Link
              href="/scenarios"
              className="px-8 py-4 text-[#7B6F63] hover:text-[#3A2F28] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#7D8461] hover:bg-[#6B7252] text-[#F6F1E8] font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Initializing...' : 'Authorize Persona Creation'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
