import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tournaments/[id]/teams - Get all registered teams for a team tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)

    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Check if tournament exists and is a team tournament
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type, title')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    // Get registered teams for this tournament with club info
    const { data: registeredTeams, error } = await serverSupabase
      .from('tournament_teams')
      .select(`
        team_id,
        teams (
          id,
          name,
          club_id,
          clubs (
            id,
            name
          )
        )
      `)
      .eq('tournament_id', tournamentIdNum)
      .order('teams(name)', { ascending: true })

    if (error) {
      console.error('Error fetching teams:', error)
      throw new Error('Failed to fetch teams')
    }

    const teams = registeredTeams?.map(rt => rt.teams) || []

    return apiSuccess({
      teams,
      tournament: {
        id: tournament.id,
        title: tournament.title,
        tournament_type: tournament.tournament_type
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
