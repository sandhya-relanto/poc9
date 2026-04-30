import { supabase } from '../db/supabase'
import Groq from 'groq-sdk'

export const getMySessions = async (req: any, res: any) => {
  const repId = req.user.id

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      id, 
      completed_at, 
      feedback_json, 
      training_scenarios (
        persona_name,
        persona_type
      )
    `)
    .eq('rep_id', repId)
    .order('completed_at', { ascending: false })
    .limit(5)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const formatted = data.map((session: any) => {
    const scenario = session.training_scenarios
    const scenarioName = scenario 
      ? `${scenario.persona_name} (${scenario.persona_type})` 
      : 'Unknown Scenario'

    return {
      id: session.id,
      scenario_name: scenarioName,
      completed_at: session.completed_at,
      feedback_json: session.feedback_json
    }
  })

  res.json(formatted)
}

export const startSession = async (req: any, res: any) => {
  const repId = req.user.id
  const { scenarioId } = req.body

  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' })
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      rep_id: repId,
      scenario_id: scenarioId,
      messages_json: []
    })
    .select('id')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ sessionId: data.id })
}

export const sendMessage = async (req: any, res: any) => {
  const { sessionId, message } = req.body
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' })
  }

  try {
    const { data: session, error: sessionErr } = await supabase
      .from('training_sessions')
      .select('*, training_scenarios(*)')
      .eq('id', sessionId)
      .single()

    if (sessionErr || !session) throw new Error('Session not found')
    
    const scenario = session.training_scenarios
    
    const systemInstruction = `You are ${scenario.persona_name}, a ${scenario.persona_type}.
Context: ${scenario.context_text}.
Difficulty: ${scenario.difficulty}.
You are in a sales call with a rep. Stay in character always.
Keep responses to 2-4 sentences maximum.
${scenario.difficulty === 'beginner' ? 'beginner: friendly and easy' : scenario.difficulty === 'intermediate' ? 'intermediate: neutral with some pushback' : 'advanced: skeptical, challenge everything, hard objections'}`

    const history = session.messages_json || []
    
    const normalizedHistory = history.map((m: any) => {
      let content = m.content
      if (!content && m.parts && m.parts.length > 0) {
        content = m.parts[0].text
      }
      const role = (m.role === 'model') ? 'assistant' : m.role
      return { role, content: content || '' }
    })
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        ...normalizedHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
    
    const replyText = completion.choices[0].message.content

    if (!replyText) {
      throw new Error("Empty response from Groq")
    }

    const updatedHistory = [...normalizedHistory, { role: 'user', content: message }, { role: 'assistant', content: replyText }]
    
    await supabase
      .from('training_sessions')
      .update({ messages_json: updatedHistory })
      .eq('id', sessionId)
      
    return res.json({ reply: replyText })
  } catch (err: any) {
    console.error("Groq error:", err)
    return res.status(200).json({
      reply: "Sorry, I couldn't process that. Please try again."
    })
  }
}

export const sendVoiceMessage = async (req: any, res: any) => {
  const { sessionId } = req.body
  const audioFile = req.file

  if (!sessionId || !audioFile) {
    return res.status(400).json({ error: 'sessionId and audio file are required' })
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

    // 1. Transcribe audio using the requested File pattern
    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioFile.buffer], 'audio.webm', { 
        type: audioFile.mimetype 
      }),
      model: 'whisper-large-v3',
      language: 'en'
    })

    const userText = transcription.text
    if (!userText) throw new Error("Transcription failed")

    // 2. Fetch session context
    const { data: session, error: sessionErr } = await supabase
      .from('training_sessions')
      .select('*, training_scenarios(*)')
      .eq('id', sessionId)
      .single()

    if (sessionErr || !session) throw new Error('Session not found')
    
    const scenario = session.training_scenarios
    const systemInstruction = `You are ${scenario.persona_name}, a ${scenario.persona_type}.
Context: ${scenario.context_text}.
Difficulty: ${scenario.difficulty}.
You are in a sales call with a rep. Stay in character always.
Keep responses to 2-4 sentences maximum.
${scenario.difficulty === 'beginner' ? 'beginner: friendly and easy' : scenario.difficulty === 'intermediate' ? 'intermediate: neutral with some pushback' : 'advanced: skeptical, challenge everything, hard objections'}`

    const history = session.messages_json || []
    const normalizedHistory = history.map((m: any) => {
      let content = m.content
      if (!content && m.parts && m.parts.length > 0) {
        content = m.parts[0].text
      }
      const role = (m.role === 'model') ? 'assistant' : m.role
      return { role, content: content || '' }
    })

    // 3. Get AI reply
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        ...normalizedHistory,
        { role: 'user', content: userText }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const replyText = completion.choices[0].message.content
    if (!replyText) throw new Error("Empty response from Groq")

    // 4. Save history
    const updatedHistory = [...normalizedHistory, { role: 'user', content: userText }, { role: 'assistant', content: replyText }]
    await supabase
      .from('training_sessions')
      .update({ messages_json: updatedHistory })
      .eq('id', sessionId)

    return res.json({ userText, reply: replyText })
  } catch (err: any) {
    console.error("Voice message error:", err)
    return res.status(500).json({ error: err.message })
  }
}

export const endSession = async (req: any, res: any) => {
  const { sessionId } = req.body
  
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })
    
  try {
    const { data: session } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
      
    if (!session) throw new Error('Session not found')
      
    const transcript = (session.messages_json || []).map((m: any) => {
      let content = m.content
      if (!content && m.parts && m.parts.length > 0) {
        content = m.parts[0].text
      }
      const role = (m.role === 'model') ? 'assistant' : m.role
      return `${role}: ${content}`
    }).join('\n')
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: 'You are a sales coach analyst. Return only raw JSON, no markdown, no backticks.' 
        },
        { 
          role: 'user', 
          content: `Analyse this sales conversation transcript and return ONLY this JSON object:
      {
        "scores": {
          "opening": number between 1-5,
          "discovery": number between 1-5,
          "objection_handling": number between 1-5,
          "talk_ratio": number between 1-5,
          "closing": number between 1-5
        },
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "improvements": ["improvement 1", "improvement 2", "improvement 3"],
        "overall_score": number between 0-100
      }
      
      Transcript:
      ${transcript}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
    
    const text = completion.choices[0].message.content

    if (!text) {
      throw new Error("Empty response from Groq")
    }

    const jsonText = text.replace(/`json|`/g, "").trim()
    const feedback = JSON.parse(jsonText)
    
    await supabase
      .from('training_sessions')
      .update({ 
        feedback_json: feedback,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      
    return res.json(feedback)
  } catch (err: any) {
    console.error("Groq feedback error:", err)
    return res.status(200).json({
      scores: {
        opening: 0,
        discovery: 0,
        objection_handling: 0,
        talk_ratio: 0,
        closing: 0
      },
      strengths: [],
      improvements: [],
      overall_score: 0
    })
  }
}

export const getSession = async (req: any, res: any) => {
  const { sessionId } = req.params
  
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, training_scenarios(*)')
    .eq('id', sessionId)
    .single()
    
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
