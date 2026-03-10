import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    id: string
    clubId: string
  }>
}

// DELETE /api/tournaments/[id]/registered-teams/[clubId] - Remove a team from a tournament
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId, clubId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const clubIdNum = parseInt(clubId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    if (isNaN(clubIdNum) || clubIdNum <= 0) {
      return validationError('Invalid club ID')
    }

    // Check if tournament exists and is a team tournament
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    // Check if team is registered
    const { data: existingRegistration } = await serverSupabase
      .from('tournament_club_teams')
      .select('tournament_id, club_id')
      .eq('tournament_id', tournamentIdNum)
      .eq('club_id', clubIdNum)
      .single()

    if (!existingRegistration) {
      return notFoundError('This club is not registered for this tournament')
    }

    // Start transaction-like operations
    // 1. Find all matches where this club participated
    const { data: clubMatches, error: matchesError } = await serverSupabase
      .from('matches')
      .select(`
        id,
        round_id,
        rounds!inner(tournament_id)
      `)
      .eq('rounds.tournament_id', tournamentIdNum)
      .or(`club_a_id.eq.${clubIdNum},club_b_id.eq.${clubIdNum}`)

    if (matchesError) {
      console.error('Error finding club matches:', matchesError)
      throw new Error('Failed to find club matches')
    }

    // 2. Delete all games from matches where this club participated
    if (clubMatches && clubMatches.length > 0) {
      const matchIds = clubMatches.map(match => match.id)
      
      const { error: gamesDeleteError } = await serverSupabase
        .from('match_games')
        .delete()
        .in('match_id', matchIds)

      if (gamesDeleteError) {
        console.error('Error deleting match games:', gamesDeleteError)
        throw new Error('Failed to delete match games')
      }

      // 3. Delete the matches themselves
      const { error: matchDeleteError } = await serverSupabase
        .from('matches')
        .delete()
        .in('id', matchIds)

      if (matchDeleteError) {
        console.error('Error deleting matches:', matchDeleteError)
        throw new Error('Failed to delete matches')
      }
    }

    // 4. Remove all players from this club that were registered for this tournament
    const { error: playersDeleteError } = await serverSupabase
      .from('tournament_team_players')
      .delete()
      .eq('tournament_id', tournamentIdNum)
      .eq('club_id', clubIdNum)

    if (playersDeleteError) {
      console.error('Error removing team players:', playersDeleteError)
      throw new Error('Failed to remove team players')
    }

    // 5. Finally, remove the team registration
    const { error: deleteError } = await serverSupabase
      .from('tournament_club_teams')
      .delete()
      .eq('tournament_id', tournamentIdNum)
      .eq('club_id', clubIdNum)

    if (deleteError) {
      console.error('Error removing team registration:', deleteError)
      throw new Error('Failed to remove team from tournament')
    }

    return apiSuccess({ 
      message: 'Team removed from tournament successfully',
      details: {
        matches_deleted: clubMatches?.length || 0,
        team_players_removed: true
      }
    })
  } catch (error) {
    return handleError(error)
  }
} 