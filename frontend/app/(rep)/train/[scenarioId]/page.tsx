'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export default function PracticeChatPage({ params }: { params: { scenarioId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [scenario, setScenario] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [ending, setEnding] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API}/api/scenarios/${params.scenarioId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setScenario(data)
          
          // First AI Message
          setMessages([{
            role: 'model',
            text: `Hello, I am ${data.persona_name}. How can I help you today?`
          }])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionId) {
      fetchScenario()
    } else {
      router.push('/train')
    }
  }, [params.scenarioId, sessionId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isTyping) return

    const userMessage = inputText.trim()
    setInputText('')
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsTyping(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/sessions/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, message: userMessage })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'model', text: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'model', text: '(Error: Failed to get AI response)' }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleEndSession = async () => {
    setEnding(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      })
      
      if (res.ok) {
        router.push(`/train/${params.scenarioId}/feedback?sessionId=${sessionId}`)
      } else {
        alert('Failed to end session')
        setEnding(false)
      }
    } catch (err) {
      console.error(err)
      alert('Error ending session')
      setEnding(false)
    }
  }

  const getDifficultyColor = (diff: string) => {
    if (diff === 'beginner') return 'bg-green-500/10 text-green-400 border-green-500/20'
    if (diff === 'intermediate') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    if (diff === 'advanced') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-gray-500/10 text-gray-400'
  }

  if (loading || !scenario) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans text-gray-100">
      
      {/* Top Bar */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h1 className="text-xl font-bold text-white">{scenario.persona_name}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${getDifficultyColor(scenario.difficulty)}`}>
            {scenario.difficulty}
          </span>
          <span className="text-sm text-gray-500 hidden md:inline-block">({scenario.persona_type})</span>
        </div>
        <button
          onClick={handleEndSession}
          disabled={ending}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:text-red-300 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
        >
          {ending ? 'Analyzing...' : 'End Session'}
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 text-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3 relative">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isTyping || ending}
              placeholder={isTyping ? "AI is typing..." : "Type your message..."}
              className="flex-1 bg-gray-950 border border-gray-700 rounded-full px-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping || ending}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-full px-5 font-medium transition-colors"
            >
              Send
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-600">Practice your pitch. The AI will respond in character.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
