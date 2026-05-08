import { createClient } from '@supabase/supabase-js'
import { supabase } from '../db/supabase'

// ── Shared admin client (bypasses RLS, manages auth/bans) ──
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Anon client (only for login) ──────────────────────────
const anonClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// ─── 1. POST /api/auth/signup/manager ───
export const managerSignup = async (req: any, res: any) => {
  const { name, email, password, orgName } = req.body

  if (!name || !email || !password || !orgName) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Create Supabase auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) return res.status(400).json({ error: authError.message })

    // Create organisation
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data: org, error: orgError } = await adminClient
      .from('organisations')
      .insert({ name: orgName, invite_code: inviteCode })
      .select()
      .single()
    if (orgError) throw orgError

    // Create user with pending status
    const { error: userError } = await adminClient.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: 'manager',
      org_id: org.id,
      approval_status: 'pending',
      manager_id: null,
      is_active: true
    })
    if (userError) throw userError

    // Ban user so they cannot login yet
    await adminClient.auth.admin.updateUserById(authData.user.id, { 
      ban_duration: '876600h' 
    })

    return res.json({ message: 'Manager signup submitted. Await admin approval.' })
  } catch (err: any) {
    console.error('Manager signup error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── 2. GET /api/auth/approved-managers ───
export const getApprovedManagers = async (req: any, res: any) => {
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('id, name, email')
      .eq('role', 'manager')
      .or('approval_status.eq.approved,approval_status.is.null')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ─── 3. POST /api/auth/signup/rep ───
export const repSignup = async (req: any, res: any) => {
  const { name, email, password, managerId } = req.body

  if (!name || !email || !password || !managerId) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // Verify manager exists and is approved
    const { data: manager, error: mError } = await adminClient
      .from('users')
      .select('id, org_id, approval_status')
      .eq('id', managerId)
      .eq('role', 'manager')
      .single()

    if (mError || !manager) {
      return res.status(400).json({ error: 'Invalid manager selected' })
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) return res.status(400).json({ error: authError.message })

    // Create rep user inheriting manager's org
    const { error: userError } = await adminClient.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: 'rep',
      org_id: manager.org_id,
      manager_id: managerId,
      approval_status: 'pending',
      is_active: true
    })
    if (userError) throw userError

    // Ban until manager approves
    await adminClient.auth.admin.updateUserById(authData.user.id, { 
      ban_duration: '876600h' 
    })

    return res.json({ message: 'Rep signup submitted. Await manager approval.' })
  } catch (err: any) {
    console.error('Rep signup error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── 4. POST /api/auth/login ───
export const login = async (req: any, res: any) => {
  const email = req.body.email?.trim().toLowerCase()
  const password = req.body.password?.trim()

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Try login via anon client
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password })

    // Handle banned user (pending approval)
    if (error?.message?.includes('banned') || error?.message?.includes('not authorized')) {
      return res.status(403).json({ error: 'Your account is awaiting approval.' })
    }
    if (error) return res.status(400).json({ error: error.message })

    // Fetch user profile
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role, org_id, name, approval_status, is_active, manager_id')
      .eq('id', data.user.id)
      .single()

    if (userError || !userData) {
      return res.status(500).json({ error: 'User profile not found' })
    }

    // Check is_active
    if (userData.is_active === false) {
      return res.status(403).json({ error: 'Account deactivated. Contact your administrator.' })
    }

    // Treat null approval_status as approved
    const effectiveStatus = userData.approval_status ?? 'approved'

    if (effectiveStatus === 'pending') {
      return res.status(403).json({ error: 'Your account is awaiting approval.' })
    }
    if (effectiveStatus === 'rejected') {
      return res.status(403).json({ error: 'Your account was rejected.' })
    }

    // Success
    const redirectTo = userData.role === 'admin'
      ? '/admin/dashboard'
      : userData.role === 'manager'
      ? '/dashboard'
      : '/rep/dashboard'

    return res.json({
      token: data.session.access_token,
      role: userData.role,
      name: userData.name,
      orgId: userData.org_id,
      managerId: userData.manager_id,
      redirectTo
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

// ─── 5. POST /api/auth/signup/admin ───
export const signupAdmin = async (req: any, res: any) => {
  const { name, email, password, adminSecret } = req.body
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' })
  }

  try {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) return res.status(400).json({ error: authError.message })

    const { error: userError } = await adminClient.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: 'admin',
      org_id: null,
      manager_id: null,
      approval_status: 'approved',
      is_active: true
    })
    if (userError) throw userError

    return res.json({ message: 'Admin created successfully' })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}