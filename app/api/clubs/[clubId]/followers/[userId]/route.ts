import { NextRequest } from 'next/server'
import { isUserFollowingClub, getClubById } from '@/lib/clubUtils'
import { validateClubId, validateUserId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    clubId: string
    userId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clubId = validateClubId(params.clubId)
    const userId = validateUserId(params.userId)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const isFollowing = await isUserFollowingClub(userId, clubId)
    return apiSuccess({ isFollowing })
  } catch (error) {
    return handleError(error)
  }
} 