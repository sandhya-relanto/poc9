import { supabase } from '../db/supabase'
import Groq from 'groq-sdk'
import { generateSystemInstruction } from '../utils/promptGenerator'
import { generateEvaluationPrompt } from '../utils/evaluationGenerator'

export const getMySessions = async (req: any, res: any) => {
  const repId = req.user.id

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      id, 
      scenario_id,
      completed_at, 
      feedback_json, 
      training_scenarios (
        persona_name,
        persona_type
      )
    `)
    .eq('rep_id', repId)
    .not('completed_at', 'is', null) // Only fetch completed sessions
    .order('completed_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Filter out coaching notes and assignments to keep only standard training sessions
  const standardSessions = data.filter((s: any) => 
    s.feedback_json && !s.feedback_json.is_note && !s.feedback_json.is_assignment
  )

  const formatted = standardSessions.map((session: any) => {
    const scenario = session.training_scenarios
    const scenarioName = scenario 
      ? `${scenario.persona_name} (${scenario.persona_type})` 
      : 'Practice Session'

    return {
      id: session.id,
      scenario_id: session.scenario_id,
      scenario_name: scenarioName,
      completed_at: session.completed_at,
      feedback_json: session.feedback_json
    }
  })

  res.json(formatted)
}


export const startPractice = async (req: any, res: any) => {
  const { scenarioId, assignmentId } = req.body
  const repId = req.user.id

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

  // If this session was started from an assignment, update the assignment tracker
  if (assignmentId) {
    console.log(`Linking session ${data.id} to assignment ${assignmentId}`);
    await supabase
      .from('training_assignments')
      .update({ 
        session_id: data.id,
        status: 'In Progress'
      })
      .eq('id', assignmentId)
      .eq('rep_id', repId)
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
    
    // Extract scenario name from context_text (e.g. "[SCENARIO: Product Demo Call] ...")
    const match = scenario.context_text?.match(/\[SCENARIO:\s*(.*?)\]/)
    const extractedScenarioName = match ? match[1] : scenario.persona_type
    
    const systemInstruction = generateSystemInstruction(
      scenario.persona_name,
      extractedScenarioName,
      scenario.difficulty
    )

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
    
    const match = scenario.context_text?.match(/\[SCENARIO:\s*(.*?)\]/)
    const extractedScenarioName = match ? match[1] : scenario.persona_type

    const systemInstruction = generateSystemInstruction(
      scenario.persona_name,
      extractedScenarioName,
      scenario.difficulty
    )

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
    
    const scenario = session.training_scenarios
    const match = scenario?.context_text?.match(/\[SCENARIO:\s*(.*?)\]/)
    const scenarioName = match ? match[1] : (scenario?.persona_type || 'Unknown')

    const prompt = generateEvaluationPrompt(scenarioName, transcript)
    
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert sales coach analyst. Return only raw JSON, no markdown, no backticks.' 
        },
        { 
          role: 'user', 
          content: prompt
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

    // Assignment Lifecycle: Mark linked assignment as Completed
    const { data: assignment } = await supabase
      .from('training_assignments')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (assignment) {
      console.log(`Closing assignment ${assignment.id} for session ${sessionId}`);
      await supabase
        .from('training_assignments')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          completed_score: score
        })
        .eq('id', assignment.id)
    }
      
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
