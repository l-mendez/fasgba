import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

// Create a singleton instance of the Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    // Use the default client without custom options to avoid type errors
    supabaseClient = createClientComponentClient<Database>()
  }
  return supabaseClient
}

// Function to ensure the session is properly initialized
export async function ensureSession() {
  const supabase = getSupabaseClient()
  
  if (!supabase) {
    console.error('Supabase client is null')
    return false
  }
  
  try {
    // Try to get the session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return false
    }
    
    if (!session) {
      // If no session, try to get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        return false
      }
      
      // If we have a user but no session, try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession) {
        console.error('Error refreshing session:', refreshError)
        return false
      }
      
      return true
    }
    
    return true
  } catch (error) {
    console.error('Error ensuring session:', error)
    return false
  }
} 