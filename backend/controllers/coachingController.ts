import { supabase } from '../db/supabase'

export const getMySignals = async (req: any, res: any) => {
  const repId = req.user.id

  // Fetch all coaching signals for the rep's calls, ordered by created_at descending
  // so we process the latest ones first.
  const { data, error } = await supabase
    .from('coaching_signals')
    .select('signal_type, value, created_at, calls!inner(rep_id)')
    .eq('calls.rep_id', repId)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Extract the latest value for each signal type
  const latest: Record<string, number> = {
    talk_ratio: 0,
    question_rate: 0,
    interactivity: 0,
    monologue_flag: 0
  }

  const seen = new Set()
  for (const row of (data || [])) {
    if (!seen.has(row.signal_type)) {
      latest[row.signal_type] = row.value
      seen.add(row.signal_type)
    }
  }

  res.json(latest)
}
