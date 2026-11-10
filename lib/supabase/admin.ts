import { SUPABASE_SECRET_KEY } from '@/lib/supabase/keys'
import type { DbClient } from '@/lib/db-types'
import type { Database } from '@/lib/database.types'
import { createClient } from '@supabase/supabase-js'

// Admin client for server-side operations that bypass RLS. Env vars are checked
// at call time (not import time) so a missing key only fails the code path that
// needs it instead of crashing `next build`.
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

let adminClient: DbClient | null = null

// Shared, lazily created admin client for module-level server utilities.
export const getAdminClient = (): DbClient => {
  adminClient ??= createAdminClient()
  return adminClient
}
