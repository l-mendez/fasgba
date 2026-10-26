import { SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/keys'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_PUBLISHABLE_KEY
  )
} 