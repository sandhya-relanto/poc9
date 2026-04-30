import { supabase } from '../db/supabase'
import { createClient } from '@supabase/supabase-js'

// ── Shared admin client (bypasses RLS, auto-confirms emails) ──
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Anon client (only for signInWithPassword) ────────────────
const anonClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// ─── MANAGER SIGNUP ───────────────────────────────────────
export const managerSignup = async (req, res) => {
  const { name, email, password, orgName } = req.body

  if (!name || !email || !password || !orgName) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  // 1. Create auth user — admin API auto-confirms email so login works immediately
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (authError) return res.status(400).json({ error: authError.message })
  if (!authData.user) return res.status(400).json({ error: 'User creation failed' })

  // 2. Generate unique invite code for the org
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  // 3. Create organisation row
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({ name: orgName, invite_code: inviteCode })
    .select()
    .single()

  if (orgError || !org) {
    console.error('Org insert error:', orgError)
    return res.status(500).json({
      error: `Failed to create organisation: ${orgError?.message ?? 'unknown'}`
    })
  }

  // 4. Create user row linked to org
  const { error: userError } = await supabase.from('users').insert({
    id:     authData.user.id,
    name,
    email,
    role:   'manager',
    org_id: org.id
  })

  if (userError) {
    console.error('User insert error:', userError)
    return res.status(500).json({ error: `Failed to create user: ${userError.message}` })
  }

  return res.json({
    message:    'Manager account created',
    inviteCode,
    orgId:      org.id
  })
}

// ─── REP SIGNUP (via invite code) ─────────────────────────
export const repSignup = async (req, res) => {
  const { name, email, password, inviteCode } = req.body

  if (!name || !email || !password || !inviteCode) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  // 1. Validate invite code → find org
  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .select()
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single()

  if (orgError || !org) {
    return res.status(400).json({ error: 'Invalid invite code — no organisation found' })
  }

  // 2. Create auth user — admin API auto-confirms email
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (authError) return res.status(400).json({ error: authError.message })
  if (!authData.user) return res.status(400).json({ error: 'User creation failed' })

  // 3. Create user row linked to the org
  const { error: userError } = await supabase.from('users').insert({
    id:     authData.user.id,
    name,
    email,
    role:   'rep',
    org_id: org.id
  })

  if (userError) {
    console.error('User insert error:', userError)
    return res.status(500).json({ error: `Failed to create user: ${userError.message}` })
  }

  return res.json({ message: 'Rep account created' })
}

// ─── LOGIN (same for both roles) ──────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // 1. Sign in via anon client (standard Supabase auth)
  let { data, error } = await anonClient.auth.signInWithPassword({ email, password })

  // If email not confirmed (old account) → auto-confirm via admin and retry once
  if (error && error.message === 'Email not confirmed') {
    console.log('⚠️  Email not confirmed — auto-confirming via admin API...')
    try {
      const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers()
      if (!listErr) {
        const match = users.find(u => u.email === email)
        if (match) {
          await adminClient.auth.admin.updateUserById(match.id, { email_confirm: true })
          // Retry login now that email is confirmed
          const retry = await anonClient.auth.signInWithPassword({ email, password })
          data  = retry.data
          error = retry.error
        }
      }
    } catch (e) {
      console.error('Auto-confirm failed:', e)
    }
  }

  if (error) {
    console.error('❌ Login error:', error.message)
    return res.status(400).json({ error: error.message })
  }

  // 2. Fetch role from users table (service-role — no RLS)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, org_id, name')
    .eq('id', data.user.id)
    .single()

  if (userError || !userData) {
    console.error('Profile fetch error:', userError)
    return res.status(500).json({ error: 'Could not fetch user profile' })
  }

  // 3. Return token + role to frontend
  return res.json({
    token: data.session.access_token,
    role:  userData.role,
    orgId: userData.org_id,
    name:  userData.name
  })
}