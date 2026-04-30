'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ManagerScenariosPage() {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Training Scenarios</h1>
            <p className="text-gray-400 mt-2">Manage the AI personas your reps practice with.</p>
          </div>
          <Link
            href="/scenarios/new"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            + Create New Scenario
          </Link>
        </div>

        {scenarios.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">You haven't created any scenarios yet.</p>
            <Link href="/scenarios/new" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
              Create your first scenario →
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-gray-950/50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Persona Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Difficulty</th>
                    <th className="px-6 py-4 font-medium w-1/2">Context Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {scenarios.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-300">{s.persona_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{s.persona_type}</td>
                      <td className="px-6 py-4 capitalize whitespace-nowrap">{s.difficulty}</td>
                      <td className="px-6 py-4">
                        <div className="truncate max-w-md" title={s.context_text}>
                          {s.context_text}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
