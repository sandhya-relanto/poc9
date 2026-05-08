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

  // 1. Link to assignment (either provided or found automatically)
  let targetAssignmentId = assignmentId;
  
  if (!targetAssignmentId) {
    console.log(`[AssignmentLifecycle] No assignmentId provided. searching for pending assignment for rep ${repId} and scenario ${scenarioId}`);
    const { data: autoAssign } = await supabase
      .from('training_assignments')
      .select('id')
      .eq('rep_id', repId)
      .eq('scenario_id', scenarioId)
      .in('status', ['Pending', 'Overdue'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (autoAssign) {
      console.log(`[AssignmentLifecycle] Auto-linked session ${data.id} to assignment ${autoAssign.id}`);
      targetAssignmentId = autoAssign.id;
    }
  }

  if (targetAssignmentId) {
    console.log(`[AssignmentLifecycle] Updating assignment ${targetAssignmentId} to 'In Progress' for session ${data.id}`);
    const { error: linkError } = await supabase
      .from('training_assignments')
      .update({ 
        session_id: data.id,
        status: 'In Progress'
      })
      .eq('id', targetAssignmentId)
      .eq('rep_id', repId)
    
    if (linkError) {
      console.error(`[AssignmentLifecycle] Failed to update assignment ${targetAssignmentId}:`, linkError);
    }
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
    const history = session.messages_json || []
    
    // Calculate metrics for realism
    const lastUserMessage = message;
    const wordCount = lastUserMessage.split(/\s+/).filter(Boolean).length;
    const questionCount = (lastUserMessage.match(/\?/g) || []).length;
    
    // Detect dismissive behavior (short, lazy, or dismissive words)
    const dismissiveKeywords = ['okay', 'sure', 'fine', 'whatever', 'dont care', 'get on with it', 'skip'];
    const isDismissive = wordCount < 5 || dismissiveKeywords.some(k => lastUserMessage.toLowerCase().includes(k));
    
    // Track consecutive dismissive turns (simplified: check last history if it was also short)
    let consecutiveDismissive = isDismissive ? 1 : 0;
    if (isDismissive && history.length >= 2) {
      const prevUser = history[history.length - 2];
      const prevWordCount = prevUser.content?.split(/\s+/).filter(Boolean).length || 0;
      if (prevWordCount < 5) consecutiveDismissive = 2;
    }

    const priorAssistantMessages = history
      .filter((m: any) => m.role === 'assistant' || m.role === 'model')
      .map((m: any) => m.content?.replace(/\[INTEL:.*?\]/g, '').trim())
      .filter(Boolean);

    const systemInstruction = generateSystemInstruction(
      scenario, 
      { wordCount, questionCount, consecutiveDismissive },
      priorAssistantMessages
    )
    
    const normalizedHistory = history.map((m: any) => {
      let content = m.content
      if (!content && m.parts && m.parts.length > 0) {
        content = m.parts[0].text
      }
      const role = (m.role === 'model') ? 'assistant' : m.role
      return { role, content: content || '' }
    })
    
    const userTurns = normalizedHistory.filter((m: any) => m.role === 'user').length + 1
    const messagesPayload: any[] = [
      { role: 'system', content: systemInstruction },
      ...normalizedHistory
    ]

    if (userTurns >= 18) {
      messagesPayload.push({
        role: 'system',
        content: 'SYSTEM NOTIFICATION: The meeting time is almost up. You MUST naturally conclude the conversation in this response.'
      })
    }
    messagesPayload.push({ role: 'user', content: message })

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messagesPayload,
      max_tokens: 80,
      temperature: 0.7
    })
    
    const replyText = completion.choices[0].message.content

    if (!replyText) throw new Error("Empty response from Groq")

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

    const transcription = await groq.audio.transcriptions.create({
      file: new File([audioFile.buffer], 'audio.webm', { 
        type: audioFile.mimetype 
      }),
      model: 'whisper-large-v3',
      language: 'en'
    })

    const userText = transcription.text
    if (!userText) throw new Error("Transcription failed")

    const { data: session, error: sessionErr } = await supabase
      .from('training_sessions')
      .select('*, training_scenarios(*)')
      .eq('id', sessionId)
      .single()

    if (sessionErr || !session) throw new Error('Session not found')
    
    const scenario = session.training_scenarios
    const history = session.messages_json || []
    
    // Metrics for voice
    const wordCount = userText.split(/\s+/).filter(Boolean).length;
    const questionCount = (userText.match(/\?/g) || []).length;
    const isDismissive = wordCount < 5;
    let consecutiveDismissive = isDismissive ? 1 : 0;
    if (isDismissive && history.length >= 2) {
      const prevUser = history[history.length - 2];
      const prevWordCount = prevUser.content?.split(/\s+/).filter(Boolean).length || 0;
      if (prevWordCount < 5) consecutiveDismissive = 2;
    }

    const priorAssistantMessages = history
      .filter((m: any) => m.role === 'assistant' || m.role === 'model')
      .map((m: any) => m.content?.replace(/\[INTEL:.*?\]/g, '').trim())
      .filter(Boolean);

    const systemInstruction = generateSystemInstruction(
      scenario, 
      { wordCount, questionCount, consecutiveDismissive },
      priorAssistantMessages
    )
    const normalizedHistory = history.map((m: any) => {
      let content = m.content
      if (!content && m.parts && m.parts.length > 0) {
        content = m.parts[0].text
      }
      const role = (m.role === 'model') ? 'assistant' : m.role
      return { role, content: content || '' }
    })

    const userTurns = normalizedHistory.filter((m: any) => m.role === 'user').length + 1
    const messagesPayload: any[] = [
      { role: 'system', content: systemInstruction },
      ...normalizedHistory
    ]

    if (userTurns >= 18) {
      messagesPayload.push({
        role: 'system',
        content: 'SYSTEM NOTIFICATION: The meeting time is almost up.'
      })
    }
    messagesPayload.push({ role: 'user', content: userText })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messagesPayload,
      max_tokens: 80,
      temperature: 0.7
    })

    const replyText = completion.choices[0].message.content
    if (!replyText) throw new Error("Empty response from Groq")

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
    // 1. Fetch Session and Scenario
    const { data: session } = await supabase
      .from('training_sessions')
      .select('*, training_scenarios(*)')
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

    // 2. CALCULATE OBJECTIVE METRICS
    const repMessages = (session.messages_json || []).filter((m: any) => m.role === 'user');
    const aiMessages = (session.messages_json || []).filter((m: any) => m.role === 'assistant');
    
    const totalRepWords = repMessages.reduce((sum: number, m: any) => sum + (m.content?.split(/\s+/).length || 0), 0);
    const totalAiWords = aiMessages.reduce((sum: number, m: any) => sum + (m.content?.split(/\s+/).length || 0), 0);
    const totalWords = totalRepWords + totalAiWords;
    
    const talkRatioRep = totalWords > 0 ? Math.round((totalRepWords / totalWords) * 100) : 50;
    const questionCount = repMessages.filter((m: any) => m.content?.includes('?')).length;
    const questionRate = repMessages.length > 0 ? Math.round((questionCount / repMessages.length) * 100) : 0;
    const avgResponseLength = repMessages.length > 0 ? Math.round(totalRepWords / repMessages.length) : 0;
    const repExchanges = repMessages.length;

    // Hard Failure Rules
    let isLowEngagement = false;
    let engagementReason = "";

    if (repExchanges < 4) {
      isLowEngagement = true;
      engagementReason = "Conversation ended prematurely (less than 4 exchanges).";
    } else if (totalRepWords < 80) {
      isLowEngagement = true;
      engagementReason = "Insufficient verbal depth (less than 80 words total).";
    } else if (avgResponseLength < 5) {
      isLowEngagement = true;
      engagementReason = "Reponses were too short and lacked meaningful content.";
    }

    // 3. MARK ASSIGNMENT AS COMPLETED (IMMEDIATELY)
    // We do this first to ensure the status updates even if AI evaluation fails
    console.log(`[AssignmentLifecycle] Searching for assignment to mark as COMPLETED for session: ${sessionId}`);
    let targetAssignmentId = null;
    
    // Check direct link first
    const { data: directAssign } = await supabase
      .from('training_assignments')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();
      
    if (directAssign) {
      targetAssignmentId = directAssign.id;
    } else {
      // Fallback search: find most recent relevant assignment
      const { data: fallbackAssign } = await supabase
        .from('training_assignments')
        .select('id')
        .eq('rep_id', session.rep_id)
        .eq('scenario_id', session.scenario_id)
        .in('status', ['Pending', 'In Progress', 'Overdue'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fallbackAssign) {
        targetAssignmentId = fallbackAssign.id;
        console.log(`[AssignmentLifecycle] Found fallback assignment: ${targetAssignmentId}`);
      }
    }

    if (targetAssignmentId) {
      const { error: updateError } = await supabase
        .from('training_assignments')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          session_id: sessionId
        })
        .eq('id', targetAssignmentId);
      
      if (updateError) {
        console.error(`[AssignmentLifecycle] Failed to mark assignment ${targetAssignmentId} as Completed:`, updateError);
      } else {
        console.log(`[AssignmentLifecycle] Successfully marked assignment ${targetAssignmentId} as COMPLETED.`);
      }
    }

    // 4. AI EVALUATION
    const prompt = `You are a Senior Enterprise Sales Coach. Evaluate this transcript strictly.
TRANSCRIPT:
${transcript}

METRICS:
- Rep Talk Ratio: ${talkRatioRep}%
- Question Rate: ${questionRate}%
- Avg Response Length: ${avgResponseLength} words
- Total Exchanges: ${repExchanges}

SCORING RULES (MANDATORY):
1. If Talk Ratio > 70%, set 'Talk Balance' score max 40%.
2. If Question Rate < 20%, set 'Discovery' score max 40%.
3. If no closing attempt found, set 'Closing' score max 40%.
4. If ${isLowEngagement ? 'TRUE' : 'FALSE'} (Low Engagement), CAP OVERALL SCORE AT 25%.
5. ${engagementReason ? `REASON FOR CAP: ${engagementReason}` : ''}

Return RAW JSON ONLY:
{
  "scores": {
    "opening": 0-100,
    "discovery": 0-100,
    "objection_handling": 0-100,
    "talk_ratio": 0-100,
    "closing": 0-100,
    "confidence": 0-100,
    "energy": 0-100
  },
  "overall_score": 0-100,
  "summary": "Professional, strict coach-like summary",
  "strengths": ["Specific transcript-aware strength"],
  "improvements": ["Critical, transcript-aware improvement"],
  "metrics": {
    "talk_ratio": "${talkRatioRep}%",
    "question_rate": "${questionRate}%",
    "avg_response_length": "${avgResponseLength} words",
    "longest_monologue": "Calculated words"
  },
  "detailed_insights": {
    "what_went_well": "Deep analysis of successful moments",
    "critical_mistakes": "Specific failures with transcript proof",
    "missed_opportunities": "Specific moments where rep could have asked/done better",
    "suggested_responses": "Specific better versions of rep messages",
    "ai_coaching_summary": "Overall coaching verdict",
    "communication_style": "Rep verbal patterns",
    "customer_reaction_analysis": "How buyer felt based on transcript"
  },
  "highlights": [{"type": "strong|weak", "rep_quote": "...", "context": "...", "suggestion": "..."}],
  "emotional_tracking": [{"moment": "...", "customer_reaction": "..."}],
  "objections_analysis": [{"objection": "...", "rep_response": "...", "is_effective": boolean, "feedback": "..."}],
  "next_practice_recommendation": "..."
}`
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
    
    let feedback;
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert sales coach analyst. Return only raw JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
      
      const text = completion.choices[0].message.content || '{}';
      const jsonText = text.replace(/`json|`/g, "").trim();
      feedback = JSON.parse(jsonText);
    } catch (evalErr) {
      console.error("[AssignmentLifecycle] AI Evaluation failed, using fallback metrics", evalErr);
      feedback = {
        scores: { opening: 75, discovery: 75, objection_handling: 75, talk_ratio: 75, closing: 75 },
        overall_score: 75,
        summary: "The session was completed successfully, but the automated performance review is temporarily unavailable."
      };
    }
    
    // 4. Final Session Update
    await supabase
      .from('training_sessions')
      .update({ 
        feedback_json: feedback,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      
    return res.json(feedback)
  } catch (err: any) {
    console.error("CRITICAL error in endSession:", err)
    return res.status(200).json({
      scores: { opening: 0, discovery: 0, objection_handling: 0, talk_ratio: 0, closing: 0 },
      overall_score: 0,
      evaluation_summary: "An error occurred, but your session was recorded."
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

export const deleteSession = async (req: any, res: any) => {
  const { sessionId } = req.params
  try {
    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
