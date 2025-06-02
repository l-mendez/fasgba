import { NextRequest } from 'next/server'
import { getClubById } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

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
    
    // Members functionality is no longer used, return empty array
    return apiSuccess([])
  } catch (error) {
    return handleError(error)
  }
} 