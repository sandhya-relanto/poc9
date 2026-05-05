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
  const email = req.body.email?.trim().toLowerCase()
  const password = req.body.password?.trim()
  const { name, orgName } = req.body

  if (!name || !email || !password || !orgName) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // 1. Find or Create Organization
    const normalizedName = orgName.trim()
    let { data: org, error: orgFetchError } = await supabase
      .from('organisations')
      .select('id')
      .ilike('name', normalizedName)
      .single()

    if (!org) {
      // Create new org if not found
      const { data: newOrg, error: createError } = await supabase
        .from('organisations')
        .insert({ name: normalizedName })
        .select()
        .single()
      
      if (createError) throw createError
      org = newOrg
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (authError) return res.status(400).json({ error: authError.message })
    if (!authData.user) return res.status(400).json({ error: 'User creation failed' })

    // 3. Create user row linked to org
    const { error: userError } = await supabase.from('users').insert({
      id:     authData.user.id,
      name,
      email,
      role:   'manager',
      org_id: org.id
    })

    if (userError) throw userError

    return res.json({
      message: 'Manager account created',
      orgId: org.id
    })
  } catch (err: any) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── REP SIGNUP (Auto-Join by Org Name) ─────────────────────────
export const repSignup = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase()
  const password = req.body.password?.trim()
  const { name, orgName } = req.body

  if (!name || !email || !password || !orgName) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    // 1. Find Organization by Name (Case-Insensitive)
    const normalizedName = orgName.trim()
    let { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .ilike('name', normalizedName)
      .single()

    if (!org) {
      // For Reps, we can either create it or return error. 
      // User requested: "If organization does not exist: Automatically create new organization record."
      const { data: newOrg, error: createError } = await supabase
        .from('organisations')
        .insert({ name: normalizedName })
        .select()
        .single()
      
      if (createError) throw createError
      org = newOrg
    }

    // 2. Create auth user
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

    if (userError) throw userError

    return res.json({ message: 'Rep account created' })
  } catch (err: any) {
    console.error('Rep Signup error:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── LOGIN (same for both roles) ──────────────────────────
export const login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase()
  const password = req.body.password?.trim()

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  console.log(`--- LOGIN ATTEMPT: ${email} ---`);

  // 1. Sign in via anon client (standard Supabase auth)
  let { data, error } = await anonClient.auth.signInWithPassword({ email, password })

  // If email not confirmed (old account) → auto-confirm via admin and retry once
  if (error && (error.message === 'Email not confirmed' || error.message.includes('confirm'))) {
    console.log(`⚠️  Email not confirmed for ${email} — auto-confirming via admin API...`)
    try {
      const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers()
      if (!listErr) {
        const match = users.find(u => u.email?.toLowerCase() === email)
        if (match) {
          await adminClient.auth.admin.updateUserById(match.id, { email_confirm: true })
          console.log(`✅ Auto-confirmed email for ${email}. Retrying login...`)
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
    console.error(`❌ Login error for ${email}:`, error.message)
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