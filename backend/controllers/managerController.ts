import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── GET /api/manager/pending-reps ───
export const getPendingReps = async (req: any, res: any) => {
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('manager_id', req.user.id)
      .eq('role', 'rep')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── POST /api/manager/approve-rep/:repId ───
export const approveRep = async (req: any, res: any) => {
  const { repId } = req.params
  try {
    // Verify rep's manager_id === req.user.id
    const { data: rep, error: rError } = await adminClient
      .from('users')
      .select('manager_id')
      .eq('id', repId)
      .single()

    if (rError || !rep || rep.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to approve this representative' })
    }

    const { error } = await adminClient
      .from('users')
      .update({
        approval_status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', repId)

    if (error) throw error

    // Unban
    await adminClient.auth.admin.updateUserById(repId, { ban_duration: 'none' })

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── POST /api/manager/reject-rep/:repId ───
export const rejectRep = async (req: any, res: any) => {
  const { repId } = req.params
  const { reason } = req.body
  try {
    // Verify rep's manager_id === req.user.id
    const { data: rep, error: rError } = await adminClient
      .from('users')
      .select('manager_id')
      .eq('id', repId)
      .single()

    if (rError || !rep || rep.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to reject this representative' })
    }

    const { error } = await adminClient
      .from('users')
      .update({
        approval_status: 'rejected',
        rejected_reason: reason
      })
      .eq('id', repId)

    if (error) throw error
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── GET /api/manager/my-reps ───
export const getMyRepsList = async (req: any, res: any) => {
  try {
    const { data: reps, error } = await adminClient
      .from('users')
      .select('*')
      .eq('manager_id', req.user.id)
      .eq('role', 'rep')
      .or('approval_status.eq.approved,approval_status.is.null')
      .order('name', { ascending: true })

    if (error) throw error

    // Fetch session counts and scores
    const { data: sessions } = await adminClient
      .from('training_sessions')
      .select('rep_id, completed_at, feedback_json')
      .in('rep_id', reps.map(r => r.id))
      .not('feedback_json', 'is', null)

    const repsWithStats = reps.map(rep => {
      const repSessions = sessions?.filter(s => s.rep_id === rep.id) || []
      const avg = repSessions.length > 0
        ? Math.round(repSessions.reduce((acc, s: any) => acc + (s.feedback_json?.overall_score || 0), 0) / repSessions.length)
        : 0
      
      const lastSession = repSessions.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )[0]

      return {
        ...rep,
        session_count: repSessions.length,
        avg_score: avg,
        last_session_date: lastSession?.completed_at || null
      }
    })

    res.json(repsWithStats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
