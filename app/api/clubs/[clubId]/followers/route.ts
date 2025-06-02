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

interface ClubFollower {
  id: string // auth UUID
  email: string
  created_at: string
}

// GET: Get all followers of a club
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId: clubIdParam } = await params
    const clubId = parseInt(clubIdParam)
    
    if (isNaN(clubId)) {
      return badRequestError('Invalid club ID')
    }
    
    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubId)
      .single()
    
    if (clubError || !club) {
      return notFoundError('Club not found')
    }
    
    // Get all followers
    const { data: followRelations, error: followError } = await supabase
      .from('user_follows_club')
      .select('auth_id, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
    
    if (followError) {
      console.error('Error fetching club followers:', followError)
      throw new Error('Failed to fetch club followers')
    }
    
    // Return followers with auth_id (we can't easily get email without admin access)
    const followers: ClubFollower[] = (followRelations || []).map(relation => ({
      id: relation.auth_id,
      email: `user-${relation.auth_id.slice(0, 8)}...`, // Show partial ID instead of email for privacy
      created_at: relation.created_at
    }))
    
    return apiSuccess({
      club: {
        id: club.id,
        name: club.name
      },
      followers: followers,
      count: followers.length
    })
  } catch (error) {
    return handleError(error)
  }
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