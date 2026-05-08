import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── GET /api/admin/stats ───
export const getAdminStats = async (req: any, res: any) => {
  try {
    const { count: total_managers } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'manager')
      .or('approval_status.eq.approved,approval_status.is.null')

    const { count: pending_managers } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'manager')
      .eq('approval_status', 'pending')

    const { count: total_reps } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'rep')
      .or('approval_status.eq.approved,approval_status.is.null')

    const today = new Date().toISOString().split('T')[0]
    const { count: sessions_today } = await adminClient
      .from('training_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today)

    const { data: sessions } = await adminClient
      .from('training_sessions')
      .select('feedback_json')
      .not('feedback_json', 'is', null)

    const avg_score = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((acc, s: any) => acc + (s.feedback_json?.overall_score || 0), 0) / sessions.length)
      : 0

    res.json({
      total_managers,
      pending_managers,
      total_reps,
      sessions_today,
      avg_score
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── GET /api/admin/pending-managers ───
export const getPendingManagers = async (req: any, res: any) => {
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('*, organisations(name)')
      .eq('role', 'manager')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── POST /api/admin/approve-manager/:userId ───
export const approveManager = async (req: any, res: any) => {
  const { userId } = req.params
  try {
    const { error } = await adminClient
      .from('users')
      .update({
        approval_status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    // Unban
    await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── POST /api/admin/reject-manager/:userId ───
export const rejectManager = async (req: any, res: any) => {
  const { userId } = req.params
  const { reason } = req.body
  try {
    const { error } = await adminClient
      .from('users')
      .update({
        approval_status: 'rejected',
        rejected_reason: reason
      })
      .eq('id', userId)

    if (error) throw error
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── GET /api/admin/managers ───
export const getManagersList = async (req: any, res: any) => {
  try {
    // Joining with organisations and counting reps
    const { data, error } = await adminClient
      .from('users')
      .select('*, organisations(name)')
      .eq('role', 'manager')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch rep counts separately as Supabase join-count can be tricky
    const { data: reps } = await adminClient
      .from('users')
      .select('manager_id')
      .eq('role', 'rep')

    const managersWithCount = data.map(m => ({
      ...m,
      rep_count: reps?.filter(r => r.manager_id === m.id).length || 0
    }))

    res.json(managersWithCount)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── GET /api/admin/users ───
export const getUsersManagement = async (req: any, res: any) => {
  const { role, search, approval_status } = req.query
  try {
    let query = adminClient
      .from('users')
      .select('*, organisations(name)')
      .order('created_at', { ascending: false })

    if (role) query = query.eq('role', role)
    if (approval_status) query = query.eq('approval_status', approval_status)
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── PATCH /api/admin/users/:userId/deactivate ───
export const deactivateUser = async (req: any, res: any) => {
  const { userId } = req.params
  try {
    await adminClient.from('users').update({ is_active: false }).eq('id', userId)
    await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876600h' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── PATCH /api/admin/users/:userId/activate ───
export const activateUser = async (req: any, res: any) => {
  const { userId } = req.params
  try {
    await adminClient.from('users').update({ is_active: true }).eq('id', userId)
    await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── PATCH /api/admin/users/:userId/reset-password ───
export const resetPassword = async (req: any, res: any) => {
  const { userId } = req.params
  const { newPassword } = req.body
  try {
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) throw error
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── DELETE /api/admin/users/:userId ───
export const deleteUser = async (req: any, res: any) => {
  const { userId } = req.params
  try {
    await adminClient.auth.admin.deleteUser(userId)
    await adminClient.from('users').delete().eq('id', userId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
