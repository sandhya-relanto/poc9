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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <Link href="/scenarios" className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-flex items-center">
            ← Back to Scenarios
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-2">Create New Scenario</h1>
          <p className="text-gray-400 mt-2">Design an AI persona for your reps to practice against.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Persona Name */}
            <div>
              <label htmlFor="persona_name" className="block text-sm font-medium text-gray-300 mb-2">
                Persona Name
              </label>
              <input
                id="persona_name"
                type="text"
                required
                placeholder="e.g. John Smith"
                value={formData.persona_name}
                onChange={(e) => setFormData({ ...formData, persona_name: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persona Type */}
              <div>
                <label htmlFor="persona_type" className="block text-sm font-medium text-gray-300 mb-2">
                  Persona Type
                </label>
                <select
                  id="persona_type"
                  value={formData.persona_type}
                  onChange={(e) => setFormData({ ...formData, persona_type: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="Skeptical CFO">Skeptical CFO</option>
                  <option value="Friendly Champion">Friendly Champion</option>
                  <option value="Technical Evaluator">Technical Evaluator</option>
                  <option value="Gatekeeper">Gatekeeper</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Context Text */}
            <div>
              <label htmlFor="context_text" className="block text-sm font-medium text-gray-300 mb-2">
                Scenario Context & Background
              </label>
              <textarea
                id="context_text"
                required
                rows={5}
                placeholder="Describe the company, the prospect's current situation, their budget constraints, and what the rep should try to achieve in this call..."
                value={formData.context_text}
                onChange={(e) => setFormData({ ...formData, context_text: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end gap-4">
              <Link
                href="/scenarios"
                className="px-6 py-2.5 text-gray-400 hover:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-indigo-300 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center min-w-[140px]"
              >
                {loading ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
