import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { authenticateAndAuthorize } from '@/lib/middleware/tournamentAuth'
import { z } from 'zod'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Validation schemas
const gameResultSchema = z.enum(['1-0', '0-1', '1/2-1/2', '*'])

const updateGameSchema = z.object({
  result: gameResultSchema.optional(),
  pgn: z.string().max(10000, 'PGN too long').optional(),
  fen: z.string().max(200, 'FEN too long').optional(),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  game_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
  white_player_id: z.number().int().positive().optional(),
  black_player_id: z.number().int().positive().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
    roundId: string
    gameId: string
  }>
}

// PATCH /api/tournaments/[id]/rounds/[roundId]/games/[gameId] - Update a game
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId, gameId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    const gameIdNum = parseInt(gameId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }
    
    if (isNaN(gameIdNum) || gameIdNum <= 0) {
      return validationError('Invalid game ID')
    }

    // Authenticate and authorize user
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
    const validatedData = updateGameSchema.parse(body)

    // Additional validation for player IDs
    if (validatedData.white_player_id && validatedData.black_player_id && 
        validatedData.white_player_id === validatedData.black_player_id) {
      return validationError('White and black players must be different')
    }

    // First, check if the round belongs to the tournament and get tournament type
    const { data: round, error: roundError } = await serverSupabase
      .from('rounds')
      .select(`
        id,
        tournaments (
          id,
          tournament_type
        )
      `)
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (roundError || !round) {
      return notFoundError('Round not found')
    }

    const tournament = Array.isArray(round.tournaments) ? round.tournaments[0] : round.tournaments
    if (!tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type === 'team') {
      // Update team match game
      const { data: updatedGame, error: updateError } = await serverSupabase
        .from('match_games')
        .update(validatedData)
        .eq('id', gameIdNum)
        .select(`
          *,
          matches (
            id,
            round_id,
            team_a:teams!team_a_id (id, name, club:clubs(id, name)),
            team_b:teams!team_b_id (id, name, club:clubs(id, name))
          ),
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .single()

      if (updateError) {
        console.error('Error updating team game:', updateError)
        throw new Error('Failed to update team game')
      }

      if (!updatedGame) {
        return notFoundError('Game not found')
      }

      return apiSuccess(updatedGame)
    } else {
      // Update individual game
      const { data: updatedGame, error: updateError } = await serverSupabase
        .from('individual_games')
        .update(validatedData)
        .eq('id', gameIdNum)
        .eq('round_id', roundIdNum)
        .select(`
          *,
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .single()

      if (updateError) {
        console.error('Error updating individual game:', updateError)
        throw new Error('Failed to update individual game')
      }

      if (!updatedGame) {
        return notFoundError('Game not found')
      }

      return apiSuccess(updatedGame)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
}

// DELETE /api/tournaments/[id]/rounds/[roundId]/games/[gameId] - Delete a game
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId, gameId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    const gameIdNum = parseInt(gameId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }
    
    if (isNaN(gameIdNum) || gameIdNum <= 0) {
      return validationError('Invalid game ID')
    }

    // Authenticate and authorize user
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

    // First, check if the round belongs to the tournament and get tournament type
    const { data: round, error: roundError } = await serverSupabase
      .from('rounds')
      .select(`
        id,
        tournaments (
          id,
          tournament_type
        )
      `)
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (roundError || !round) {
      return notFoundError('Round not found')
    }

    const tournament = Array.isArray(round.tournaments) ? round.tournaments[0] : round.tournaments
    if (!tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type === 'team') {
      // Delete team match game
      const { error: deleteError } = await serverSupabase
        .from('match_games')
        .delete()
        .eq('id', gameIdNum)

      if (deleteError) {
        console.error('Error deleting team game:', deleteError)
        throw new Error('Failed to delete team game')
      }
    } else {
      // Delete individual game
      const { error: deleteError } = await serverSupabase
        .from('individual_games')
        .delete()
        .eq('id', gameIdNum)
        .eq('round_id', roundIdNum)

      if (deleteError) {
        console.error('Error deleting individual game:', deleteError)
        throw new Error('Failed to delete individual game')
      }
    }

    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 