import { NextRequest } from 'next/server'
import { isUserClubAdmin, getClubById, addClubAdmin, removeClubAdmin } from '@/lib/clubUtils'
import { validateClubId, validateUserId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{
    clubId: string
    userId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { clubId: clubIdParam, userId: userIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    const userId = validateUserId(userIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const isAdmin = await isUserClubAdmin(clubId, userId)
    return apiSuccess({ isAdmin })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { clubId: clubIdParam, userId: userIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    const userId = validateUserId(userIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    // Check if current user has permission to add club admins
    // Must be either a site admin or a club admin of this club
    const { data: siteAdmin } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isClubAdmin = await isUserClubAdmin(clubId, user.id)

    if (!siteAdmin && !isClubAdmin) {
      return unauthorizedError('You must be a site admin or club admin to add club admins')
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !targetUser.user) {
      return notFoundError('User not found', `No user found with ID ${userId}`)
    }

    // Check if user is already a club admin
    const isAlreadyAdmin = await isUserClubAdmin(clubId, userId)
    if (isAlreadyAdmin) {
      return handleError(new Error('User is already an admin of this club'))
    }

    // Add the user as club admin
    await addClubAdmin(clubId, userId)
    
    return apiSuccess({ 
      success: true, 
      message: `User ${userId} added as admin to club ${clubId}`,
      admin: {
        id: userId,
        email: targetUser.user.email
      }
    }, 201)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { clubId: clubIdParam, userId: userIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    const userId = validateUserId(userIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    // Check if current user has permission to remove club admins
    // Must be either a site admin or a club admin of this club
    const { data: siteAdmin } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isClubAdmin = await isUserClubAdmin(clubId, user.id)

    if (!siteAdmin && !isClubAdmin) {
      return unauthorizedError('You must be a site admin or club admin to remove club admins')
    }

    // Check if target user is actually a club admin
    const isTargetAdmin = await isUserClubAdmin(clubId, userId)
    if (!isTargetAdmin) {
      return notFoundError('User is not an admin of this club', `User ${userId} is not an admin of club ${clubId}`)
    }

    // Remove the user as club admin
    await removeClubAdmin(clubId, userId)
    
    return apiSuccess({ 
      success: true, 
      message: `User ${userId} removed as admin from club ${clubId}`
    })
  } catch (error) {
    return handleError(error)
  }
} 