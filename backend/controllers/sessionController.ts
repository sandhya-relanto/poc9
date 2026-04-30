import { supabase } from '../db/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
    const newHistory = [...history, { role: 'user', parts: [{ text: message }] }]
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction
    })
    
    const chat = model.startChat({ history })
    const result = await chat.sendMessage(message)
    const text = result.response.text()

    if (!text) {
      throw new Error("Empty response from Gemini")
    }

    console.log("Gemini response:", text)
    
    const updatedHistory = [...newHistory, { role: 'model', parts: [{ text }] }]
    
    await supabase
      .from('training_sessions')
      .update({ messages_json: updatedHistory })
      .eq('id', sessionId)
      
    return res.json({ reply: text })
  } catch (err: any) {
    console.error("Gemini error:", err)
    return res.status(200).json({
      reply: "Sorry, I couldn't process that. Please try again."
    })
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
      
    const transcript = (session.messages_json || []).map((m: any) => 
      `${m.role}: ${m.parts[0].text}`
    ).join('\n')
    
    const prompt = `Analyse this sales practice conversation.
Return ONLY raw JSON with no markdown backticks:
{
  "scores": {
    "opening": number 1-5,
    "discovery": number 1-5,
    "objection_handling": number 1-5,
    "talk_ratio": number 1-5,
    "closing": number 1-5
  },
  "strengths": ["max 3 items"],
  "improvements": ["max 3 items"],
  "overall_score": number 0-100
}

Transcript:
${transcript}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    if (!text) {
      throw new Error("Empty response from Gemini")
    }

    console.log("Gemini response:", text)
    
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
    console.error("Gemini error:", err)
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
