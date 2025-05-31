import { NextRequest } from 'next/server'
import { getClubNews, getClubById } from '@/lib/clubUtils'
import { validateClubId, validateClubNewsQuery } from '@/lib/schemas/clubSchemas'
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
    const { searchParams } = new URL(request.url)
    const queryParams = validateClubNewsQuery(searchParams)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const news = await getClubNews(clubId, queryParams.limit)
    return apiSuccess(news)
  } catch (error) {
    return handleError(error)
  }
} 