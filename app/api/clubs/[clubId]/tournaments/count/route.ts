import { NextRequest } from 'next/server'
import { getClubTournamentCount, getClubById, DateFilterOptions } from '@/lib/clubUtils'
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    if (startDate && !dateRegex.test(startDate)) {
      return validationError('Invalid startDate format. Use YYYY-MM-DD format.', 'INVALID_DATE_FORMAT')
    }

    if (endDate && !dateRegex.test(endDate)) {
      return validationError('Invalid endDate format. Use YYYY-MM-DD format.', 'INVALID_DATE_FORMAT')
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return validationError('startDate must be before or equal to endDate.', 'INVALID_DATE_RANGE')
    }

    // Prepare date filter options
    const dateFilterOptions: DateFilterOptions = {}
    if (startDate) dateFilterOptions.startDate = startDate
    if (endDate) dateFilterOptions.endDate = endDate

    // Get tournament count
    const count = await getClubTournamentCount(clubId, dateFilterOptions)

    return apiSuccess({ count })
  } catch (error) {
    return handleError(error)
  }
} 