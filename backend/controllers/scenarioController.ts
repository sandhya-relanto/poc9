import { supabase } from '../db/supabase'

export const getScenarios = async (req: any, res: any) => {
  const orgId = req.user.org_id

  const { data, error } = await supabase
    .from('training_scenarios')
    .select('id, persona_name, persona_type, context_text, difficulty')
    .eq('org_id', orgId)
    .order('id', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}

export const createScenario = async (req: any, res: any) => {
  const orgId = req.user.org_id
  const { persona_name, persona_type, context_text, difficulty } = req.body

  if (!persona_name || !persona_type || !context_text || !difficulty) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const { data, error } = await supabase
    .from('training_scenarios')
    .insert({
      org_id: orgId,
      persona_name,
      persona_type,
      context_text,
      difficulty
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}

export const getScenario = async (req: any, res: any) => {
  const { scenarioId } = req.params
  
  const { data, error } = await supabase
    .from('training_scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single()
    
  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}
