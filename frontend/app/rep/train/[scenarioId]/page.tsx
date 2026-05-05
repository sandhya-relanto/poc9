'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

  // Voice States
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isProcessing, isSpeaking])

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
      
      setMessages(prev => [...prev, 
        { role: 'user', content: data.userText },
        { role: 'assistant', content: data.reply }
      ])
      
      speakText(data.reply)
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
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
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
    <div className="min-h-screen bg-[#F6F1E8] flex flex-col font-jakarta text-[#3A2F28]">
      
      {/* Top Bar */}
      <header className="bg-[#EFE7DC] border-b border-[#D8CCBC] p-6 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
          <div>
            <h1 className="text-xl font-extrabold text-[#3A2F28] tracking-tight">
              {scenario.customer_info?.name || scenario.persona_name}
            </h1>
            <p className="text-[9px] font-black text-[#7B6F63] uppercase tracking-[0.2em] mt-0.5">
              Target: {scenario.persona_type || 'Strategic Account'}
            </p>
          </div>
          <div className="flex bg-[#EAE2D6] rounded-xl p-1 border border-[#D8CCBC]">
            <button 
              onClick={() => { setIsVoiceMode(false); window.speechSynthesis.cancel(); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isVoiceMode ? 'bg-[#F6F1E8] text-[#7D8461] shadow-sm' : 'text-[#7B6F63] hover:text-[#3A2F28]'}`}
            >
              Text Mode
            </button>
            <button 
              onClick={() => setIsVoiceMode(true)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceMode ? 'bg-[#F6F1E8] text-[#7D8461] shadow-sm' : 'text-[#7B6F63] hover:text-[#3A2F28]'}`}
            >
              Voice Mode
            </button>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          disabled={ending}
          className="px-6 py-3 bg-[#A06A5B] hover:bg-[#8B5C4F] disabled:opacity-50 text-[#F6F1E8] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
        >
          {ending ? 'Processing...' : 'End Mission'}
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-[2rem] px-8 py-5 text-base font-medium shadow-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#7D8461] text-[#F6F1E8] rounded-tr-none'
                    : 'bg-[#EFE7DC] text-[#3A2F28] border border-[#D8CCBC] rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {(isTyping || isProcessing || isSpeaking) && (
            <div className="flex justify-start">
              <div className="bg-[#EFE7DC] border border-[#D8CCBC] text-[#3A2F28] rounded-[2rem] rounded-tl-none px-8 py-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#7D8461] font-black uppercase tracking-[0.2em] animate-pulse">
                    {isProcessing ? 'Intercepting Data...' : 
                     isSpeaking ? `${scenario.customer_info?.name || 'Target'} is speaking...` : 
                     'Analyzing Response...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#7D8461] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#7D8461] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#7D8461] rounded-full animate-bounce"></div>
                </div>
                {isSpeaking && (
                   <button 
                     onClick={() => window.speechSynthesis.cancel()}
                     className="mt-2 text-[9px] font-black uppercase tracking-widest bg-[#F6F1E8] border border-[#D8CCBC] px-3 py-1.5 rounded-lg text-[#7B6F63] hover:text-[#3A2F28] transition-all w-fit"
                   >
                     Mute Target
                   </button>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#EAE2D6] border-t border-[#D8CCBC] p-8 shrink-0">
        <div className="max-w-4xl mx-auto">
          {!isVoiceMode ? (
            <form onSubmit={handleSend} className="flex gap-4 relative">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isTyping || ending}
                placeholder={isTyping ? "Transmitting..." : "Command your next move..."}
                className="flex-1 bg-[#F6F1E8] border border-[#D8CCBC] rounded-[1.5rem] px-8 py-5 text-[#3A2F28] placeholder-[#D8CCBC] focus:outline-none focus:ring-4 focus:ring-[#7D8461]/5 transition-all disabled:opacity-50 font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping || ending}
                className="absolute right-3 top-3 bottom-3 bg-[#7D8461] hover:bg-[#6B7252] disabled:bg-[#D6C2A8] text-[#F6F1E8] rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleMicClick}
                  disabled={isProcessing || isSpeaking || ending}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-[#F6F1E8] text-4xl transition-all shadow-xl ${
                    isRecording 
                      ? 'bg-[#A06A5B] animate-pulse scale-110' 
                      : 'bg-[#7D8461] hover:bg-[#6B7252]'
                  }`}
                >
                  {isRecording ? '⏹' : '🎤'}
                </button>
                <p className="text-[#7B6F63] text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                  {isRecording ? 'Recording Active' : 'Authorize Voice Command'}
                </p>
              </div>
              
              <div className="text-center h-10">
                {(isProcessing || isSpeaking) && (
                  <div className="flex flex-col items-center gap-3">
                    {isSpeaking && (
                       <div className="flex justify-center items-center gap-1 h-6">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 bg-[#7D8461] rounded-full animate-voice-wave`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                          ))}
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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
      `}</style>
    </div>
  )
}
