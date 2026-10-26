import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

// Service-role client shared across club server utilities.
export const supabase = createClient(supabaseUrl, supabaseServiceKey)
