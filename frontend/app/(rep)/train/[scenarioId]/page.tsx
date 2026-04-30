'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
          
          setMessages([{
            role: 'assistant',
            content: `Hello, I am ${data.persona_name}. How can I help you today?`
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
  }, [messages, isTyping, isProcessing, isSpeaking])

  // --- Voice Mode Logic ---

  const handleMicClick = async () => {
    if (isRecording) {
      // STOP recording
      mediaRecorder?.stop()
      setIsRecording(false)
    } else {
      // START recording
      chunksRef.current = []
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        const recorder = new MediaRecorder(stream)
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data)
          }
        }
        
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          console.log('Audio blob size:', blob.size)
          await sendVoiceMessage(blob)
        }
        
        recorder.start()
        setMediaRecorder(recorder)
        setIsRecording(true)
        console.log('Recording started')
        
      } catch (err) {
        console.error('Microphone error:', err)
        alert('Microphone blocked. Click the lock icon in your browser address bar and allow microphone access for localhost:3000, then refresh the page.')
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
    utterance.rate = 0.95
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
          <div className="flex bg-gray-800 rounded-lg p-1 ml-2">
            <button 
              onClick={() => { setIsVoiceMode(false); window.speechSynthesis.cancel(); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!isVoiceMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Text Mode
            </button>
            <button 
              onClick={() => setIsVoiceMode(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isVoiceMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Voice Mode
            </button>
          </div>
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
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}

          {(isTyping || isProcessing || isSpeaking) && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 text-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {isProcessing && <span className="text-xs text-indigo-400 animate-pulse font-medium">Processing...</span>}
                  {isSpeaking && <span className="text-xs text-indigo-400 animate-pulse font-medium">{scenario.persona_name} is speaking...</span>}
                  {isTyping && <span className="text-xs text-gray-400 animate-pulse font-medium">AI Thinking...</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                {isSpeaking && (
                   <button 
                     onClick={() => window.speechSynthesis.cancel()}
                     className="mt-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors w-fit"
                   >
                     Stop Audio
                   </button>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-800 p-6 shrink-0">
        <div className="max-w-3xl mx-auto">
          {!isVoiceMode ? (
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
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleMicClick}
                  disabled={isProcessing || isSpeaking || ending}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse scale-110' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isRecording ? '⏹' : '🎤'}
                </button>
                <p className="text-gray-400 text-sm mt-2">
                  {isRecording ? 'Recording... tap to stop' : 'Tap to speak'}
                </p>
              </div>
              
              <div className="text-center">
                {(isProcessing || isSpeaking) && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-indigo-400">
                      {isProcessing ? 'Processing...' : `${scenario.persona_name} is speaking...`}
                    </p>
                    {isSpeaking && (
                       <div className="flex justify-center items-center gap-0.5 h-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 bg-indigo-500 rounded-full animate-[sound-wave_0.5s_ease-in-out_infinite]`} style={{ animationDelay: `${i * 0.1}s`, height: '100%' }}></div>
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
        @keyframes sound-wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  )
}
