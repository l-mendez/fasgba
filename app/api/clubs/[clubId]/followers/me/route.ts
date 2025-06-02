import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, badRequestError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return badRequestError('Invalid club ID')
    }
    
    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', clubId)
      .single()
    
    if (clubError || !club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND)
    }
    
    // Check if user is following the club
    const { data: followRelation, error: followError } = await supabase
      .from('user_follows_club')
      .select('auth_id')
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
      .single()
    
    if (followError && followError.code !== 'PGRST116') {
      throw followError
    }
    
    const isFollowing = !!followRelation
    
    return apiSuccess({ 
      isFollowing,
      clubId,
      userId: user.id
    })
  } catch (error) {
    return handleError(error)
  }
} 