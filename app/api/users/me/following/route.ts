import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Get clubs that the user is following
    const { data, error } = await supabase
      .from('user_follows_club')
      .select(`
        clubs!inner (
          id,
          name,
          address,
          telephone,
          mail,
          schedule
        )
      `)
      .eq('auth_id', user.id)

    if (error) {
      console.error('Error fetching followed clubs:', error)
      throw new Error('Failed to fetch followed clubs')
    }

    const followedClubs = (data || []).map(item => (item as any).clubs).filter(club => club !== null)
    
    return apiSuccess(followedClubs)
  } catch (error) {
    return handleError(error)
  }
} 