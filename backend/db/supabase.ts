import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl      = process.env.SUPABASE_URL!
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey          = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')

// ── Service-role client (used for DB inserts — bypasses RLS) ──
// ⚠️  Never expose this key to the browser
if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
  throw new Error(
    '❌  SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
    '   Go to Supabase → Project Settings → API → service_role → copy the secret key\n' +
    '   Then paste it in backend/.env as SUPABASE_SERVICE_ROLE_KEY=<key>'
  )
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false
  }
})

// ── Anon client (used only for auth.signUp / signInWithPassword) ──
export const supabaseAuth = createClient(supabaseUrl, anonKey)
