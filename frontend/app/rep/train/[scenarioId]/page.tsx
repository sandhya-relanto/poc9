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
  const assignmentId = searchParams.get('assignmentId')

  const [scenario, setScenario] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [ending, setEnding] = useState(false)

  const MAX_TURNS = 20
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes

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

      setMessages(prev => [...prev,
      { role: 'user', content: data.userText },
      { role: 'assistant', content: data.reply }
      ])

      speakText(data.reply, data.audio)
    } catch (err) {
      console.error('Voice error:', err)
      alert('Failed to process voice. Try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const speakText = (text: string, audioBase64?: string) => {
    // 1. Try playing high-quality ElevenLabs audio first
    if (audioBase64) {
      console.log('[ElevenLabs] Playing high-quality audio response');
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = (e) => {
        console.error('[ElevenLabs] Playback error:', e);
        setIsSpeaking(false);
      };
      audio.play().catch(err => {
        console.error('[ElevenLabs] Failed to play audio:', err);
        // Fallback if audio.play fails
        fallbackToNativeTTS(text);
      });
      return;
    }

    // 2. Fallback to native browser TTS
    fallbackToNativeTTS(text);
  }

  const fallbackToNativeTTS = (text: string) => {
    console.log('[TTS] Falling back to native browser speech synthesis');
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
        speakText(data.reply, data.audio)
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
        console.log(`[Lifecycle] Session ${sessionId} ended successfully. Checking for assignment link...`);
        console.log(`[Lifecycle] assignmentId from searchParams:`, assignmentId);
        
        // If there was an assignment linked, record this attempt
        if (assignmentId && assignmentId !== 'undefined' && assignmentId !== 'null') {
          try {
            console.log(`[Lifecycle] Recording attempt for: ${assignmentId} using Session: ${sessionId}`);
            const completeRes = await fetch(`${API}/api/users/complete-assignment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ assignmentId, sessionId })
            })
            if (completeRes.ok) {
              const resData = await completeRes.json();
              console.log(`[Lifecycle] Attempt recorded:`, resData.message);
            } else {
              const errData = await completeRes.json();
              console.error(`[Lifecycle] Failed to record attempt:`, errData);
            }
          } catch (err) {
            console.error('[Lifecycle] Error during attempt recording API call:', err)
          }
        } else {
          console.log(`[Lifecycle] No valid assignmentId found to mark as completed.`);
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
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[var(--bg)] flex flex-col font-jakarta text-[var(--text)] overflow-hidden">

      <header className="bg-white border-b border-[var(--border)] px-8 py-5 flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleEndSession} 
            disabled={ending} 
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <span className="text-lg">←</span> Leave Session
          </button>
          <div className="flex items-center gap-3 pl-8 border-l border-[var(--border)]">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <span className="text-sm font-extrabold tracking-tight text-[var(--text)]">LIVE SIMULATION</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className={`px-5 py-2 rounded-xl border flex items-center gap-2.5 text-[11px] font-bold tracking-widest transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]'}`}>
              <span className="text-sm">⏱</span> {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
           </div>
           <div className={`px-5 py-2 rounded-xl border flex items-center gap-2.5 text-[11px] font-bold tracking-widest transition-all ${Math.floor(messages.length / 2) >= MAX_TURNS - 2 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]'}`}>
              <span className="text-sm">💬</span> TURN {Math.floor(messages.length / 2)}/{MAX_TURNS}
           </div>
        </div>
      </header>

      {ending && (
        <div className="fixed inset-0 z-[999] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="w-20 h-20 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-3xl font-black text-[var(--text)] mb-4 tracking-tight uppercase">Session Finalized</h2>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
            <p className="text-[var(--text-muted)] text-[11px] uppercase tracking-[0.4em] font-black">Analyzing Performance Data</p>
            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse delay-75"></div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">

        <div className="w-[22%] min-w-[320px] border-r border-[var(--border)] bg-[var(--panel)] flex flex-col shadow-inner">
          <div className="p-8 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]/50">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-5">Persona Intelligence</h2>
            <h3 className="text-2xl font-black text-[var(--text)] mb-1 leading-tight tracking-tight">
              {scenario.customer_info?.name || scenario.persona_name || 'Target Persona'}
            </h3>
            <p className="text-[11px] text-[var(--primary)] font-black uppercase tracking-widest mt-1">
              {scenario.persona_type || 'Decision Maker'}
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {scenario.difficulty && (
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-700 border-green-200' :
                  scenario.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  Level: {scenario.difficulty}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10">
            {(() => {
              if (!scenario?.context_text) return null;
              
              let text = scenario.context_text;
              let metadata: any = null;
              let scenarioTitle = scenario.scenario_name || null;

              const metadataMatch = text.match(/\[SCENARIO_METADATA:\s*({.*?})\]/s);
              if (metadataMatch) {
                try {
                  metadata = JSON.parse(metadataMatch[1]);
                  text = text.replace(metadataMatch[0], '');
                } catch (e) { console.error("Failed to parse metadata", e); }
              }

              const scenarioMatch = text.match(/\[SCENARIO:\s*(.*?)\]/);
              if (scenarioMatch) {
                scenarioTitle = scenarioMatch[1];
                text = text.replace(scenarioMatch[0], '');
              }

              text = text.trim();

              const renderSection = (title: string, content: any, isList: boolean = false) => {
                if (!content) return null;
                return (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{title}</h4>
                    {isList ? (
                      <ul className="space-y-2.5">
                        {content.split('\n').filter((i: string) => i.trim()).map((item: string, i: number) => (
                          <li key={i} className="flex gap-3 text-base text-[var(--text)] leading-relaxed">
                            <span className="text-[var(--primary)] font-black mt-1">•</span>
                            <span className="font-medium">{item.replace(/^[-*•]\s*/, '').trim()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-base text-[var(--text)] leading-relaxed font-medium">{content}</p>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {renderSection("Strategic Scenario", scenarioTitle)}
                  {renderSection("Operational Objective", text)}
                  {metadata && (
                    <>
                      {renderSection("Behavioral Traits", metadata.personality_traits)}
                      {renderSection("Resistance Profile", metadata.objection_style, true)}
                      {renderSection("Key Success Metrics", metadata.evaluation_focus, true)}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white relative">
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[radial-gradient(circle_at_center,rgba(125,132,97,0.05)_0%,transparent_70%)]">
            <div className="relative group">
              <div className={`w-56 h-56 rounded-[3rem] bg-[var(--panel)] border-2 flex items-center justify-center relative shadow-2xl transition-all duration-700 ease-out ${isSpeaking ? 'border-[var(--primary)] scale-105 shadow-[0_20px_50px_rgba(125,132,97,0.2)]' : 'border-[var(--border)] grayscale-[20%] group-hover:grayscale-0'}`}>
                <span className="text-7xl font-black text-[var(--text)] tracking-tighter opacity-80">
                  {(scenario.customer_info?.name || scenario.persona_name || 'T').substring(0, 2).toUpperCase()}
                </span>
                
                <div className={`absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl transition-all duration-300 ${isSpeaking ? 'bg-[var(--primary)] scale-110' : 'bg-[var(--text-muted)] scale-90 opacity-0'}`}>
                  <span className="text-white text-xl animate-pulse">🔊</span>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center space-y-2">
              <h2 className="text-4xl font-black text-[var(--text)] tracking-tight">
                {scenario.customer_info?.name || scenario.persona_name || 'Target Persona'}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="h-[1px] w-8 bg-[var(--border)]"></span>
                <p className="text-[11px] font-black text-[var(--primary)] uppercase tracking-[0.3em]">
                  {scenario.persona_type || 'EXECUTIVE LEADERSHIP'}
                </p>
                <span className="h-[1px] w-8 bg-[var(--border)]"></span>
              </div>
            </div>

            <div className="mt-12 h-16 w-64 flex items-center justify-center bg-[var(--surface)]/30 rounded-3xl border border-[var(--border)]/50 px-8">
              {isSpeaking ? (
                <div className="flex justify-center items-center gap-2 h-10 w-full">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-[var(--primary)] rounded-full animate-voice-wave" 
                      style={{ 
                        animationDelay: `${i * 0.08}s`,
                        height: `${30 + Math.random() * 70}%`
                      }}
                    ></div>
                  ))}
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-bounce"></div>
                </div>
              ) : (
                <div className="flex justify-center items-center gap-2 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full"></div>
                  ))}
                </div>
              )}
            </div>

            {isSpeaking && (
              <button
                onClick={() => window.speechSynthesis.cancel()}
                className="mt-8 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border)] text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2"
              >
                <span>✕</span> Stop Voice Playback
              </button>
            )}
          </div>

          <div className="p-8 border-t border-[var(--border)] bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="max-w-4xl mx-auto flex items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-lg cursor-pointer ${isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                  : 'bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--border)] shadow-sm'
                  }`}
                  onClick={handleMicClick}
                >
                  {isRecording ? '⏹' : '🎤'}
                </div>
                
                <form onSubmit={handleSend} className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    disabled={isTyping || ending || isRecording || isProcessing}
                    placeholder={isRecording ? "Listening to your audio input..." : "Draft your communication..."}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-7 py-5 text-lg text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all font-medium disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping || ending || isRecording}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all shadow-md"
                  >
                    <span className="text-lg">➔</span>
                  </button>
                </form>
              </div>

              <div className="h-10 w-[1px] bg-[var(--border)] opacity-50"></div>

              <button
                onClick={handleEndSession}
                disabled={ending}
                className="px-8 py-4.5 bg-white hover:bg-red-50 border border-[var(--border)] hover:border-red-200 text-red-600 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-sm"
              >
                {ending ? 'Processing...' : 'End Briefing'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-[28%] min-w-[380px] border-l border-[var(--border)] bg-white flex flex-col">
          <div className="p-8 border-b border-[var(--border)] shrink-0 flex justify-between items-center bg-[var(--surface)]/30">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Communication Log</h2>
            <span className="px-2.5 py-1 bg-white border border-[var(--border)] rounded-md text-[9px] font-black text-[var(--text-muted)]">ENCRYPTED</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 px-10">
                <div className="text-4xl">💬</div>
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting Initial Contact</p>
              </div>
            )}
            
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-6 py-4.5 text-base font-semibold shadow-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[var(--primary)] text-white rounded-tr-none'
                      : 'bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] rounded-tl-none shadow-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-inherit">{m.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                   <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    {m.role === 'user' ? 'REPRESENTATIVE' : (scenario.customer_info?.name || scenario.persona_name || 'TARGET').toUpperCase()}
                  </span>
                  <span className="text-[8px] text-[var(--border)]">•</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            
            {(isTyping || isProcessing) && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl rounded-tl-none px-6 py-4.5 flex items-center gap-2.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes voice-wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
        .animate-voice-wave {
          animation: voice-wave 0.8s ease-in-out infinite;
          transform-origin: center;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
