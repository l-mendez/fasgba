import type { Database } from '@/lib/database.types'
import { SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/keys'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_PUBLISHABLE_KEY
  )
} 