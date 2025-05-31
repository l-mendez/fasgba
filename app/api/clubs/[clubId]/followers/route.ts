import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { followClub, unfollowClub, isUserFollowingClub } from '@/lib/clubUtils'
import { apiSuccess, handleError, unauthorizedError, conflictError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const clubId = parseInt(params.clubId)
    
    if (isNaN(clubId)) {
      throw new Error('Invalid club ID')
    }

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

    // Check if user is already following the club
    const isAlreadyFollowing = await isUserFollowingClub(clubId, user.id)
    
    if (isAlreadyFollowing) {
      return conflictError('User is already following this club')
    }

    // Follow the club
    await followClub(clubId, user.id)
    
    return apiSuccess({ success: true }, 201)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { clubId: string } }) {
  try {
    const clubId = parseInt(params.clubId)
    
    if (isNaN(clubId)) {
      throw new Error('Invalid club ID')
    }

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

    // Unfollow the club
    await unfollowClub(clubId, user.id)
    
    return new Response(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
} 