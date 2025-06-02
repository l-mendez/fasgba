import { NextRequest } from 'next/server'
import { getClubTournaments, getClubById, DateFilterOptions } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limitParam = searchParams.get('limit')

    // Parse limit parameter
    let limit: number | undefined
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return validationError('Invalid limit parameter. Must be a number between 1 and 100.')
      }
      limit = parsedLimit
    }

    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (startDate && !dateRegex.test(startDate)) {
      return validationError('Invalid startDate format. Use YYYY-MM-DD format.')
    }
    if (endDate && !dateRegex.test(endDate)) {
      return validationError('Invalid endDate format. Use YYYY-MM-DD format.')
    }

    // Validate date range if both provided
    if (startDate && endDate && startDate > endDate) {
      return validationError('startDate must be before or equal to endDate.')
    }

    const options: DateFilterOptions & { limit?: number } = {
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(limit && { limit })
    }

    const tournaments = await getClubTournaments(clubId, options)
    
    return apiSuccess({ tournaments })
  } catch (error: any) {
    console.error('Error in GET /api/clubs/[clubId]/tournaments:', error)
    return handleError(error)
  }
} 