import { NextRequest } from 'next/server'
import { getClubAdmins, getClubById, addClubAdmin, removeClubAdmin, isUserClubAdmin } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const admins = await getClubAdmins(clubId)
    return apiSuccess(admins)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
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

    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return handleError(new Error('Email is required'))
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

    // Find user by email using Supabase Auth Admin API
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers()
    
    if (searchError) {
      throw new Error('Failed to search for user')
    }

    const targetUser = users.find(u => u.email === email)
    
    if (!targetUser) {
      return notFoundError('User not found', `No user found with email ${email}`)
    }

    // Check if user is already a club admin
    const isAlreadyAdmin = await isUserClubAdmin(clubId, targetUser.id)
    if (isAlreadyAdmin) {
      return handleError(new Error('User is already an admin of this club'))
    }

    // Add the user as club admin
    await addClubAdmin(clubId, targetUser.id)
    
    return apiSuccess({ 
      success: true, 
      message: `User ${email} added as admin to club ${clubId}`,
      admin: {
        id: targetUser.id,
        email: targetUser.email
      }
    }, 201)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
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

    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return handleError(new Error('User ID is required'))
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