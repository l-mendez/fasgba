import { NextRequest } from 'next/server'
import { getClubById, updateClub, isUserClubAdmin } from '@/lib/clubUtils'
import { validateClubId, validateUpdateClub } from '@/lib/schemas/clubSchemas'
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

    // Check if user is admin of this club
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    if (!isClubAdmin) {
      return unauthorizedError('You must be an admin of this club to access its settings')
    }
    
    return apiSuccess(club)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const existingClub = await getClubById(clubId)
    if (!existingClub) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    // Check if user is admin of this club
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    if (!isClubAdmin) {
      return unauthorizedError('You must be an admin of this club to modify its settings')
    }
    
    const body = await request.json()
    const validatedData = validateUpdateClub(body)
    
    const success = await updateClub(clubId, validatedData)
    
    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 