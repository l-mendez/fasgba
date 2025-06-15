import { NextRequest } from 'next/server'
import { getTournamentGames } from '@/lib/gameUtils'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tournaments/[id]/games - Get all games for a tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const tournamentId = parseInt(id, 10)
    
    if (isNaN(tournamentId) || tournamentId <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Get tournament type from query params
    const { searchParams } = new URL(request.url)
    const tournamentType = searchParams.get('type') || 'individual'

    // Fetch games using server-side utility
    const gamesByRound = await getTournamentGames(tournamentId, tournamentType)

    return apiSuccess({ 
      gamesByRound,
      tournamentId 
    })
  } catch (error) {
    return handleError(error)
  }
} 