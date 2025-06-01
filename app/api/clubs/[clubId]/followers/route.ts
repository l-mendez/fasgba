import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, noContent, handleError, badRequestError, notFoundError, conflictError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    
    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows_club')
      .select('id')
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
      .single()
    
    if (existingFollow) {
      return conflictError('Already following this club')
    }
    
    // Create follow relationship
    const { error: followError } = await supabase
      .from('user_follows_club')
      .insert({
        auth_id: user.id,
        club_id: clubId
      })
    
    if (followError) {
      throw followError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return badRequestError('Invalid club ID')
    }
    
    // Remove follow relationship
    const { error } = await supabase
      .from('user_follows_club')
      .delete()
      .eq('auth_id', user.id)
      .eq('club_id', clubId)
    
    if (error) {
      throw error
    }
    
    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 