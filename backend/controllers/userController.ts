import { supabase } from '../db/supabase'

export const getMe = async (req: any, res: any) => {
  // req.user is attached by the authenticate middleware
  // It contains { id, name, email, role, org_id }
  res.json(req.user)
}

export const getReps = async (req: any, res: any) => {
  const orgId = req.user.org_id

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('org_id', orgId)
    .eq('role', 'rep')
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data || [])
}

export const getInviteCode = async (req: any, res: any) => {
  const orgId = req.user.org_id

  const { data, error } = await supabase
    .from('organisations')
    .select('invite_code')
    .eq('id', orgId)
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ inviteCode: data.invite_code })
}
