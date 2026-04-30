'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function RepStatsPage() {
  const [loading, setLoading] = useState(true)
  const [repName, setRepName] = useState('')
  const [metrics, setMetrics] = useState<any[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [hasSignals, setHasSignals] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const headers = {
          'Authorization': `Bearer ${token}`
        }

        // Fetch User
        const userRes = await fetch(`${API}/api/users/me`, { headers })
        if (userRes.ok) {
          const user = await userRes.json()
          setRepName(user.name)
        }

        // Fetch Coaching Signals
        const signalsRes = await fetch(`${API}/api/coaching/my-signals`, { headers })
        if (signalsRes.ok) {
          const signals = await signalsRes.json()
          
          const totalSignals = Object.values(signals).reduce((a: any, b: any) => a + b, 0)
          if (totalSignals === 0) {
            setHasSignals(false)
          }

          setMetrics([
            {
              name: 'Talk Ratio',
              value: `${signals.talk_ratio}%`,
              benchmark: 'Benchmark: 50%',
              status: signals.talk_ratio > 60 ? 'bad' : signals.talk_ratio > 40 ? 'green' : 'medium',
            },
            {
              name: 'Question Rate',
              value: `${signals.question_rate}%`,
              benchmark: 'Benchmark: 30%',
              status: signals.question_rate < 20 ? 'bad' : signals.question_rate < 30 ? 'medium' : 'green',
            },
            {
              name: 'Interactivity Score',
              value: `${signals.interactivity}%`,
              benchmark: 'Medium',
              status: signals.interactivity < 30 ? 'bad' : signals.interactivity < 50 ? 'medium' : 'green',
            },
            {
              name: 'Monologue Flag',
              value: signals.monologue_flag === 1 ? 'Detected' : 'Clear',
              benchmark: 'Long monologue detected',
              status: signals.monologue_flag === 1 ? 'bad' : 'green',
            },
          ])
        }

        // Fetch Sessions
        const sessionsRes = await fetch(`${API}/api/sessions/my-sessions`, { headers })
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json()
          setRecentSessions(sessions)
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">My Performance</h1>
            <p className="text-gray-400 mt-1">Welcome back{repName ? `, ${repName}` : ''}</p>
          </div>
          <Link
            href="/train"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            Practice with AI Trainer
          </Link>
        </div>

        {/* Metrics Grid */}
        {!hasSignals ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No calls analysed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col justify-between"
              >
                <h3 className="text-gray-400 text-sm font-medium">{metric.name}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      metric.status === 'bad'
                        ? 'text-red-500'
                        : metric.status === 'medium'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{metric.benchmark}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Sessions Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Last 5 Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No practice sessions yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-gray-950/50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Scenario</th>
                    <th className="px-6 py-4 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentSessions.map((session) => {
                    // Extract a fake score from feedback_json or default if missing
                    const score = session.feedback_json?.overall_score || 'N/A'
                    const dateObj = new Date(session.completed_at)
                    const dateStr = isNaN(dateObj.getTime()) ? session.completed_at : dateObj.toLocaleDateString()

                    return (
                      <tr key={session.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{dateStr}</td>
                        <td className="px-6 py-4 font-medium text-gray-300">{session.scenario_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                            {score}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
