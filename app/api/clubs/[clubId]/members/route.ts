import { NextRequest } from 'next/server'
import { getClubMembers, getClubById } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    clubId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clubId = validateClubId(params.clubId)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const members = await getClubMembers(clubId)
    return apiSuccess(members)
  } catch (error) {
    return handleError(error)
  }
} 