import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getTournamentById, getAllTournamentsWithDates, transformTournamentToDisplay } from '@/lib/tournamentUtils'
import { validateTournamentId, validateSingleTournamentQuery } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tournamentId = validateTournamentId(params.id)
    const { searchParams } = new URL(request.url)
    const queryParams = validateSingleTournamentQuery(searchParams)
    
    if (queryParams.format === 'display') {
      // For display format, we need to get tournament with dates and transform it
      const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
      const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
      
      if (!tournamentWithDates) {
        return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
      }
      
      const displayTournament = transformTournamentToDisplay(tournamentWithDates)
      return apiSuccess(displayTournament)
    }
    
    // Default format: raw
    const tournament = await getTournamentById(supabase, tournamentId)
    
    if (!tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    return apiSuccess(tournament)
  } catch (error) {
    return handleError(error)
  }
} 