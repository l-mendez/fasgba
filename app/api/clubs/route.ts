import { NextRequest } from 'next/server'
import { 
  getAllClubs, 
  searchClubsByName, 
  getClubsWithContact, 
  createClub,
  getClubWithStats
} from '@/lib/clubUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { validateClubQuery, validateCreateClub } from '@/lib/schemas/clubSchemas'
import { apiSuccess, created, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = validateClubQuery(searchParams)
    
    let clubs
    
    // Handle different query combinations
    if (queryParams.search) {
      clubs = await searchClubsByName(queryParams.search)
    } else if (queryParams.hasContact) {
      clubs = await getClubsWithContact()
    } else {
      clubs = await getAllClubs()
    }
    
    // Handle include=stats
    if (queryParams.include === 'stats') {
      const clubsWithStats = await Promise.all(
        clubs.map(async (club) => {
          const clubWithStats = await getClubWithStats(club.id)
          return clubWithStats || club // Fallback to basic club if stats fail
        })
      )
      return apiSuccess(clubsWithStats)
    }
    
    return apiSuccess(clubs)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    
    const body = await request.json()
    const validatedData = validateCreateClub(body)
    
    const newClub = await createClub(validatedData)
    
    if (!newClub) {
      const creationError = new Error(ERROR_MESSAGES.CREATION_FAILED)
      creationError.name = 'DatabaseError'
      throw creationError
    }
    
    return created(newClub)
  } catch (error) {
    return handleError(error)
  }
} 