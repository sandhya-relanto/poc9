'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { extractIntel, cleanBotMessage } from '@/utils/cleanMessage'
import { highlightKeywords } from '@/utils/highlightKeywords'
import { getInitials } from '@/utils/getInitials'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function PracticeChatPage({ params }: { params: { scenarioId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const assignmentId = searchParams.get('assignmentId')

  const [scenario, setScenario] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [ending, setEnding] = useState(false)
  
  // Real-time Intel States
  const [intel, setIntel] = useState<any>({ mood: 'Evaluating', temp: 'Cold', tip: null, mistake: null })
  const [showMistake, setShowMistake] = useState(false)

  const MAX_TURNS = 20
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes

  // Voice States
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

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
      router.push('/rep/train')
    }
  }, [params.scenarioId, sessionId, router])

  useEffect(() => {
    if (ending || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ending, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !ending) {
      handleEndSession();
    }
  }, [timeLeft, ending]);

  useEffect(() => {
    const turns = Math.floor(messages.length / 2);
    if (!ending && turns >= MAX_TURNS) {
      handleEndSession();
    }
  }, [messages, ending]);

  // --- Voice Mode Logic ---

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorder?.stop()
      setIsRecording(false)
    } else {
      chunksRef.current = []
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          await sendVoiceMessage(blob)
        }

        recorder.start()
        setMediaRecorder(recorder)
        setIsRecording(true)
      } catch (err) {
        console.error('Microphone error:', err)
        alert('Microphone access denied. Please allow microphone access in your browser settings.')
      }
    }
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('sessionId', sessionId || '')

      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/sessions/voice-message`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) throw new Error('Voice request failed')
      const data = await res.json()

      const cleanReply = cleanBotMessage(data.reply)
      const parsedIntel = extractIntel(data.reply)
      
      if (parsedIntel) {
        setIntel(parsedIntel)
        if (parsedIntel.mistake) {
          setShowMistake(true)
          setTimeout(() => setShowMistake(false), 3000)
        }
      }

      setMessages(prev => [...prev,
      { role: 'user', content: data.userText },
      { role: 'assistant', content: cleanReply }
      ])

      speakText(cleanReply)
    } catch (err) {
      console.error('Voice error:', err)
      alert('Failed to process voice. Try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const speakText = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // --- Regular Text Logic ---

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isTyping) return

    const userMessage = inputText.trim()
    setInputText('')

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
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
        const cleanReply = cleanBotMessage(data.reply)
        const parsedIntel = extractIntel(data.reply)
        
        if (parsedIntel) {
          setIntel(parsedIntel)
          if (parsedIntel.mistake) {
            setShowMistake(true)
            setTimeout(() => setShowMistake(false), 3000)
          }
        }
        setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '(Error: Failed to get AI response)' }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTyping(false)
    }
  }

  const handleEndSession = async () => {
    setEnding(true)
    window.speechSynthesis.cancel()
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
        if (assignmentId && assignmentId !== 'undefined' && assignmentId !== 'null') {
          try {
            await fetch(`${API}/api/users/complete-assignment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ assignmentId })
            })
          } catch (err) {
            console.error('[Lifecycle] Error during assignment completion API call:', err)
          }
        }
        
        router.push(`/rep/train/${params.scenarioId}/review?sessionId=${sessionId}`)
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

  if (loading || !scenario) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7D8461]"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#3A2F28] flex flex-col font-jakarta text-[#F6F1E8] overflow-hidden">
      <header className="bg-[#2A221D] border-b border-[#4A3C32] px-6 py-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={handleEndSession} disabled={ending} className="text-[#A06A5B] hover:text-[#8B5C4F] text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50">
            ← Leave Call
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold tracking-tight text-[#F6F1E8]">Live Simulation</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 text-[10px] font-bold tracking-widest ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#3A2F28] border-[#4A3C32] text-[#D8CCBC]'}`}>
              ⏱ {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
           </div>
           <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 text-[10px] font-bold tracking-widest ${Math.floor(messages.length / 2) >= MAX_TURNS - 2 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#3A2F28] border-[#4A3C32] text-[#D8CCBC]'}`}>
              💬 Turn {Math.floor(messages.length / 2)}/{MAX_TURNS}
           </div>
        </div>
      </header>

      {ending && (
        <div className="fixed inset-0 z-[999] bg-[#1F1915] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="w-20 h-20 border-4 border-[#7D8461] border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(125,132,97,0.2)]"></div>
          <h2 className="text-4xl font-black text-[#F6F1E8] mb-4 tracking-tight uppercase">Session Completed</h2>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#7D8461] rounded-full animate-pulse"></div>
            <p className="text-[#D8CCBC] text-xs uppercase tracking-[0.3em] font-black">Generating Intelligence Report</p>
            <div className="w-2 h-2 bg-[#7D8461] rounded-full animate-pulse delay-75"></div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-1/4 min-w-[300px] border-r border-[#4A3C32] bg-[#2A221D] flex flex-col">
          <div className="p-6 border-b border-[#4A3C32] shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A06A5B] mb-4">Persona Brief</h2>
            <h3 className="text-2xl font-extrabold text-[#F6F1E8] mb-1">
              {scenario.customer_info?.name || scenario.persona_name || 'Target Persona'}
            </h3>
            <p className="text-xs text-[#D8CCBC] font-medium uppercase tracking-wider">
              {scenario.persona_type || 'Target Account'}
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {scenario.difficulty && (
                <span className="px-3 py-1 bg-[#3A2F28] border border-[#4A3C32] rounded-full text-[9px] font-black uppercase tracking-widest text-[#A06A5B]">
                  {scenario.difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
              {scenario.context_text && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A06A5B] mb-2">Goal & Context</h4>
                  <p className="text-sm text-[#D8CCBC] leading-relaxed whitespace-pre-wrap">
                    {scenario.context_text.replace(/\[SCENARIO_METADATA:.*?\]/gs, '').replace(/\[SCENARIO:.*?\]/g, '').trim()}
                  </p>
                </div>
              )}

              {/* Deal Temp in Left Panel */}
              <div className="pt-8 border-t border-[#4A3C32] mt-8">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A06A5B]">Deal Temperature</h4>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    intel.temp === 'Hot' ? 'text-red-400' : intel.temp === 'Warm' ? 'text-amber-400' : 'text-[#7D8461]'
                  }`}>
                    {intel.temp}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#3A2F28] rounded-full overflow-hidden border border-[#4A3C32]">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      intel.temp === 'Hot' ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.4)]' : 
                      intel.temp === 'Warm' ? 'bg-amber-400' : 
                      'bg-[#7D8461]'
                    }`}
                    style={{ width: intel.temp === 'Hot' ? '100%' : intel.temp === 'Warm' ? '60%' : '20%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="flex-1 flex flex-col bg-[#3A2F28] relative">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`w-48 h-48 rounded-full bg-[#2A221D] border-4 flex items-center justify-center relative shadow-2xl transition-all duration-500 ${isSpeaking ? 'border-[#7D8461] scale-105 shadow-[#7D8461]/20' : 'border-[#4A3C32]'}`}>
              <span className="text-6xl font-black text-[#F6F1E8] tracking-tighter">
                {scenario.persona_initials || getInitials(scenario.customer_info?.name || scenario.persona_name)}
              </span>
              <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#3A2F28] ${isSpeaking ? 'bg-[#7D8461]' : 'bg-[#4A3C32]'}`}>
                <span className="text-white text-sm">🔊</span>
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-extrabold text-[#F6F1E8]">
              {scenario.customer_info?.name || scenario.persona_name || 'Target Persona'}
            </h2>
            
            {/* Buyer Mood pill */}
            <div className="mt-4 bg-[#2A221D]/80 backdrop-blur-md border border-[#7D8461]/40 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in zoom-in duration-500">
              <span className="text-sm">
                {intel.mood === 'Interested' ? '😊' : intel.mood === 'Skeptical' ? '😤' : intel.mood === 'Ready to Close' ? '🔥' : '🤔'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F6F1E8]">
                Buyer Mood: <span className={intel.mood === 'Skeptical' ? 'text-red-400' : 'text-[#7D8461]'}>{intel.mood}</span>
              </span>
            </div>

            {showMistake && (
               <div className="mt-6 bg-[#A06A5B] text-white px-8 py-3 rounded-2xl shadow-[0_0_40px_rgba(160,106,91,0.4)] animate-in slide-in-from-top-10 duration-300 flex items-center gap-3 z-50">
                  <span className="text-lg">❌</span>
                  <span className="text-xs font-black uppercase tracking-widest">{intel.mistake}</span>
               </div>
            )}

            <div className="mt-8 h-12 flex items-center justify-center">
              {isSpeaking ? (
                <div className="flex justify-center items-center gap-1.5 h-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-2 bg-[#7D8461] rounded-full animate-voice-wave`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                  ))}
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#7D8461] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#7D8461] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#7D8461] rounded-full animate-bounce"></div>
                </div>
              ) : (
                <div className="flex justify-center items-center gap-1.5 h-4 opacity-30">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 bg-[#7B6F63] rounded-full h-2"></div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-[#4A3C32] bg-[#2A221D] shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-4 relative">
              {intel.tip && !isTyping && !isRecording && (
                 <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#D6C2A8]/10 backdrop-blur-xl border border-[#D6C2A8]/30 p-5 rounded-[1.5rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 z-40">
                    <div className="flex items-start gap-4">
                       <span className="text-xl">💡</span>
                       <div>
                          <p className="text-[9px] font-black text-[#D6C2A8] uppercase tracking-widest mb-1">AI Coaching Tip</p>
                          <p className="text-xs text-[#F6F1E8] font-medium leading-relaxed">{intel.tip}</p>
                       </div>
                    </div>
                 </div>
              )}

              <form onSubmit={handleSend} className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={isTyping || ending || isRecording || isProcessing}
                  placeholder={isRecording ? "Recording your voice..." : "Type your response..."}
                  className="w-full bg-[#3A2F28] border border-[#4A3C32] rounded-[1.5rem] px-6 py-4 text-[#F6F1E8] placeholder-[#A06A5B]/70 focus:outline-none focus:border-[#7D8461] transition-all font-medium"
                />
              </form>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isProcessing || isSpeaking || ending}
                className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xl transition-all shadow-lg ${isRecording ? 'bg-[#A06A5B] text-white animate-pulse' : 'bg-[#A06A5B] hover:bg-[#8B5C4F] text-[#F6F1E8]'}`}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[30%] min-w-[350px] border-l border-[#4A3C32] bg-[#2A221D] flex flex-col">
          <div className="p-6 border-b border-[#4A3C32] shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A06A5B]">Conversation History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm font-medium shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-[#A06A5B] text-white rounded-tr-sm' : 'bg-[#3A2F28] text-white border border-[#4A3C32] rounded-tl-sm'}`}>
                  <p className="whitespace-pre-wrap text-inherit">
                    {m.role === 'assistant' ? highlightKeywords(m.content) : m.content}
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A06A5B] mt-2">
                  {m.role === 'user' ? 'You' : scenario.customer_info?.name || scenario.persona_name || 'Target'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes voice-wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        .animate-voice-wave {
          animation: voice-wave 0.6s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3A2F28;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
