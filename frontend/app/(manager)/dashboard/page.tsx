'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [managerName, setManagerName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [reps, setReps] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const headers = { 'Authorization': `Bearer ${token}` }

        // Fetch User
        const userRes = await fetch(`${API}/api/users/me`, { headers })
        if (userRes.ok) {
          const user = await userRes.json()
          setManagerName(user.name)
        }

        // Fetch Invite Code
        const inviteRes = await fetch(`${API}/api/users/invite-code`, { headers })
        if (inviteRes.ok) {
          const data = await inviteRes.json()
          setInviteCode(data.inviteCode)
        }

        // Fetch Reps
        const repsRes = await fetch(`${API}/api/users/reps`, { headers })
        if (repsRes.ok) {
          const data = await repsRes.json()
          setReps(data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const copyInviteCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Team Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back{managerName ? `, ${managerName}` : ''}</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/scenarios"
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
            >
              Manage Scenarios
            </Link>
            <Link
              href="/scenarios/new"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              + Create Scenario
            </Link>
          </div>
        </div>

        {/* Invite Code Box */}
        {inviteCode && (
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-indigo-400 font-medium mb-1">Grow Your Team</h3>
              <p className="text-gray-400 text-sm">Share this invite code with your sales reps so they can join your organization.</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 w-full sm:w-auto">
              <span className="text-gray-400 text-sm">Code:</span>
              <span className="text-indigo-300 font-mono font-bold tracking-wider text-lg">{inviteCode}</span>
              <button
                onClick={copyInviteCode}
                className="ml-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Reps Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Your Sales Reps</h2>
          
          {reps.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-gray-300 text-lg font-medium">No reps yet.</p>
              <p className="text-gray-500 mt-2">Share your invite code to add team members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reps.map((rep) => (
                <div key={rep.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between hover:border-gray-700 transition-colors">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                      {rep.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{rep.name}</h3>
                    <p className="text-gray-400 text-sm">{rep.email}</p>
                  </div>
                  
                  <Link
                    href={`/reps/${rep.id}`}
                    className="w-full block text-center py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
                  >
                    View Performance
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
