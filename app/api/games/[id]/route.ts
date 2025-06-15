import { NextRequest } from 'next/server'
import { getGameById } from '@/lib/gameUtils'
import { apiSuccess, handleError, validationError, notFoundError } from '@/lib/utils/apiResponse'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/games/[id] - Get a specific game by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const gameId = parseInt(id, 10)
    
    if (isNaN(gameId) || gameId <= 0) {
      return validationError('Invalid game ID')
    }

    // Get tournament type from query params
    const { searchParams } = new URL(request.url)
    const tournamentType = searchParams.get('type') || 'individual'

    // Fetch game using server-side utility
    const game = await getGameById(gameId, tournamentType)

    if (!game) {
      return notFoundError('Game not found')
    }

    return apiSuccess({ 
      game,
      gameId 
    })
  } catch (error) {
    return handleError(error)
  }
} 