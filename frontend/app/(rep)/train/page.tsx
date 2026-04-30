'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function TrainPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const res = await fetch(`${API}/api/scenarios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          setScenarios(data)
        }
      } catch (err) {
        console.error('Failed to fetch scenarios', err)
      } finally {
        setLoading(false)
      }
    }

    fetchScenarios()
  }, [])

  const handleStartPractice = async (scenarioId: string) => {
    setStarting(scenarioId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scenarioId })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/train/${scenarioId}?sessionId=${data.sessionId}`)
      } else {
        alert('Failed to start session. Please try again.')
        setStarting(null)
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to the server.')
      setStarting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase()
    if (d === 'beginner') return 'bg-green-500/10 text-green-400 border-green-500/20'
    if (d === 'intermediate') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    if (d === 'advanced') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Training Scenarios</h1>
          <p className="text-gray-400 mt-2">Select a scenario below to practice your sales pitches with an AI persona.</p>
        </div>

        {scenarios.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No training scenarios available yet.</p>
            <p className="text-gray-500 mt-2">Ask your manager to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((s) => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col hover:border-gray-700 transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h2 className="text-xl font-semibold text-white leading-tight">{s.persona_name}</h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(s.difficulty)} capitalize whitespace-nowrap`}>
                      {s.difficulty}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-indigo-300">
                      Persona: {s.persona_type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                    {s.context_text}
                  </p>
                </div>

                <button
                  onClick={() => handleStartPractice(s.id)}
                  disabled={starting === s.id}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:text-indigo-300 text-white font-medium rounded-lg transition-colors flex justify-center items-center"
                >
                  {starting === s.id ? (
                    <span className="animate-pulse">Starting...</span>
                  ) : (
                    'Start Practice'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
