// @ts-nocheck
/* eslint-disable */
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, unauthorizedError, forbiddenError, noContent } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { z } from 'zod'
import { isUserClubAdmin } from '@/lib/clubUtils'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    id: string
    roundId: string
    matchId: string
  }>
}

// Validation schema for updating match
const updateMatchSchema = z.object({
  team_a_id: z.number().int().positive('Invalid club A ID'),
  team_b_id: z.number().int().positive('Invalid club B ID')
}).refine(data => data.team_a_id !== data.team_b_id, {
  message: 'Los dos equipos deben ser diferentes',
  path: ['team_b_id']
})

// Helper auth function
async function authenticateAndAuthorize(request: NextRequest, tournamentId: number) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  // Site admin?
  const { data: admin, error: adminError } = await serverSupabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', user.id)
    .single()

  const isSiteAdmin = !adminError && !!admin
  if (isSiteAdmin) return user

  // If not site admin, must be club admin of tournament club
  const { data: tournament, error: tErr } = await serverSupabase
    .from('tournaments')
    .select('created_by_club_id')
    .eq('id', tournamentId)
    .single()

  if (tErr || !tournament) {
    throw new Error('TOURNAMENT_NOT_FOUND')
  }

  if (tournament.created_by_club_id) {
    const permitted = await isUserClubAdmin(tournament.created_by_club_id, user.id)
    if (!permitted) throw new Error('FORBIDDEN')
  } else {
    // Tournament without club: user must admin at least one club
    const { data: userClubs, error: clubsErr } = await serverSupabase
      .from('club_admins')
      .select('club_id')
      .eq('auth_id', user.id)
    if (clubsErr || !userClubs || userClubs.length === 0) {
      throw new Error('FORBIDDEN')
    }
  }
  return user
}

// GET /api/tournaments/[id]/rounds/[roundId]/matches/[matchId] - Get a specific match
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId, matchId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    const matchIdNum = parseInt(matchId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }

    if (isNaN(matchIdNum) || matchIdNum <= 0) {
      return validationError('Invalid match ID')
    }

    // Check if match exists and belongs to the correct round/tournament
    const { data: match, error } = await serverSupabase
      .from('matches')
      .select(`
        id,
        team_a:teams!team_a_id (id, name),
        team_b:teams!team_b_id (id, name),
        rounds (
          id,
          round_number,
          tournaments (
            id,
            tournament_type,
            title
          )
        )
      `)
      .eq('id', matchIdNum)
      .eq('round_id', roundIdNum)
      .single()

    if (error || !match) {
      return notFoundError('Match not found')
    }

    const round = match.rounds
    if (!round || !round.tournaments) {
      return notFoundError('Round or tournament not found')
    }

    const tournament = round.tournaments
    if (tournament.id !== tournamentIdNum) {
      return notFoundError('Match does not belong to the specified tournament')
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    return apiSuccess({ 
      match: {
        id: match.id,
        club_a: match.team_a,
        club_b: match.team_b
      },
      round: {
        id: round.id,
        round_number: round.round_number,
        tournament_id: tournamentIdNum
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

// PATCH /api/tournaments/[id]/rounds/[roundId]/matches/[matchId] - Update a match
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId, matchId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    const matchIdNum = parseInt(matchId, 10)

    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }
    if (isNaN(matchIdNum) || matchIdNum <= 0) {
      return validationError('Invalid match ID')
    }

    // Auth & authorization
    try {
      await authenticateAndAuthorize(request, tournamentIdNum)
    } catch (authError) {
      if (authError instanceof Error) {
        switch (authError.message) {
          case 'UNAUTHORIZED':
            return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
          case 'FORBIDDEN':
            return forbiddenError('No tienes permisos para gestionar este torneo')
          case 'TOURNAMENT_NOT_FOUND':
            return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
          default:
            throw authError
        }
      }
      throw authError
    }

    const body = await request.json()
    let validated
    try {
      validated = updateMatchSchema.parse(body)
    } catch (zErr) {
      if (zErr instanceof z.ZodError) {
        const msg = zErr.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return validationError(`Validation error: ${msg}`)
      }
      throw zErr
    }

    // Check if match exists and belongs to the correct round/tournament
    const { data: existingMatch, error: matchError } = await serverSupabase
      .from('matches')
      .select(`
        id,
        rounds (
          id,
          tournaments (
            id,
            tournament_type
          )
        )
      `)
      .eq('id', matchIdNum)
      .eq('round_id', roundIdNum)
      .single()

    if (matchError || !existingMatch) {
      return notFoundError('Match not found')
    }

    const round = existingMatch.rounds
    if (!round || !round.tournaments) {
      return notFoundError('Round or tournament not found')
    }

    const tournament = round.tournaments
    if (tournament.id !== tournamentIdNum) {
      return notFoundError('Match does not belong to the specified tournament')
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('Match updates are only allowed in team tournaments')
    }

    // Before updating the match, delete all games associated with this match
    // This maintains coherence as requested
    const { error: deleteGamesError } = await serverSupabase
      .from('match_games')
      .delete()
      .eq('match_id', matchIdNum)

    if (deleteGamesError) {
      console.error('Error deleting match games:', deleteGamesError)
      throw new Error('Failed to delete existing games for match update')
    }

    // Update the match
    const { data: updatedMatch, error: updateError } = await serverSupabase
      .from('matches')
      .update({
        team_a_id: validated.team_a_id,
        team_b_id: validated.team_b_id
      })
      .eq('id', matchIdNum)
      .select(`
        id,
        team_a:teams!team_a_id (id, name),
        team_b:teams!team_b_id (id, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating match:', updateError)
      throw new Error('Failed to update match')
    }

    if (!updatedMatch) {
      return notFoundError('Match not found after update')
    }

    return apiSuccess({
      match: updatedMatch,
      games_deleted: true,
      message: 'Match updated successfully. All existing games for this match have been deleted to maintain coherence.'
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/tournaments/[id]/rounds/[roundId]/matches/[matchId] - Delete a match
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId, matchId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    const matchIdNum = parseInt(matchId, 10)

    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }
    if (isNaN(matchIdNum) || matchIdNum <= 0) {
      return validationError('Invalid match ID')
    }

    // Auth & authorization
    try {
      await authenticateAndAuthorize(request, tournamentIdNum)
    } catch (authError) {
      if (authError instanceof Error) {
        switch (authError.message) {
          case 'UNAUTHORIZED':
            return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
          case 'FORBIDDEN':
            return forbiddenError('No tienes permisos para gestionar este torneo')
          case 'TOURNAMENT_NOT_FOUND':
            return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
          default:
            throw authError
        }
      }
      throw authError
    }

    // Check if match exists and belongs to the correct round/tournament
    const { data: existingMatch, error: matchError } = await serverSupabase
      .from('matches')
      .select(`
        id,
        rounds (
          id,
          tournaments (
            id,
            tournament_type
          )
        )
      `)
      .eq('id', matchIdNum)
      .eq('round_id', roundIdNum)
      .single()

    if (matchError || !existingMatch) {
      return notFoundError('Match not found')
    }

    const round = existingMatch.rounds
    if (!round || !round.tournaments) {
      return notFoundError('Round or tournament not found')
    }

    const tournament = round.tournaments
    if (tournament.id !== tournamentIdNum) {
      return notFoundError('Match does not belong to the specified tournament')
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('Match deletion is only allowed in team tournaments')
    }

    // Get count of games before deletion
    const { count: gamesCount } = await serverSupabase
      .from('match_games')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchIdNum)

    // Delete the match (this will cascade to delete all associated games)
    const { error: deleteError } = await serverSupabase
      .from('matches')
      .delete()
      .eq('id', matchIdNum)

    if (deleteError) {
      console.error('Error deleting match:', deleteError)
      throw new Error('Failed to delete match')
    }

    return apiSuccess({
      message: 'Match deleted successfully',
      games_deleted: gamesCount || 0
    })
  } catch (error) {
    return handleError(error)
  }
} 