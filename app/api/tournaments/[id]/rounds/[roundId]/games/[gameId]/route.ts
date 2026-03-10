import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

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

// Helper function to authenticate and authorize user for tournament operations
async function authenticateAndAuthorize(request: NextRequest, tournamentId: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Verify the JWT token with Supabase
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  // Check if user is site admin
  const { data: admin, error: adminError } = await serverSupabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', user.id)
    .single()

  const isSiteAdmin = !adminError && !!admin

  // If not site admin, check if user is club admin for the tournament's club
  if (!isSiteAdmin) {
    // Get tournament's club
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('created_by_club_id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      throw new Error('TOURNAMENT_NOT_FOUND')
    }

    // If tournament has a club, check if user is admin of that club
    if (tournament.created_by_club_id) {
      const isClubAdmin = await isUserClubAdmin(tournament.created_by_club_id, user.id)
      if (!isClubAdmin) {
        throw new Error('FORBIDDEN')
      }
    } else {
      // If tournament has no club, user must have at least one club they admin
      const { data: userClubs, error: clubError } = await serverSupabase
        .from('club_admins')
        .select('club_id')
        .eq('auth_id', user.id)

      if (clubError || !userClubs || userClubs.length === 0) {
        throw new Error('FORBIDDEN')
      }
    }
  }

  return user
}

// GET /api/tournaments/[id]/rounds/[roundId]/games/[gameId] - Get a specific game
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
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

    // First, check if the round belongs to the tournament and get tournament type
    const { data: round, error: roundError } = await serverSupabase
      .from('rounds')
      .select(`
        id,
        round_number,
        tournaments (
          id,
          tournament_type,
          title
        )
      `)
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (roundError || !round) {
      return notFoundError('Round not found')
    }

    const tournament = round.tournaments
    if (!tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type === 'team') {
      // Get team match game
      const { data: game, error } = await serverSupabase
        .from('match_games')
        .select(`
          *,
          matches (
            id,
            round_id,
            club_a:clubs!club_a_id (id, name),
            club_b:clubs!club_b_id (id, name)
          ),
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .eq('id', gameIdNum)
        .eq('matches.round_id', roundIdNum)
        .single()

      if (error || !game) {
        return notFoundError('Game not found')
      }

      return apiSuccess({ 
        game, 
        tournament_type: 'team',
        round: {
          id: round.id,
          round_number: round.round_number,
          tournament_id: tournamentIdNum
        }
      })
    } else {
      // Get individual game
      const { data: game, error } = await serverSupabase
        .from('individual_games')
        .select(`
          *,
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .eq('id', gameIdNum)
        .eq('round_id', roundIdNum)
        .single()

      if (error || !game) {
        return notFoundError('Game not found')
      }

      return apiSuccess({ 
        game, 
        tournament_type: 'individual',
        round: {
          id: round.id,
          round_number: round.round_number,
          tournament_id: tournamentIdNum
        }
      })
    }
  } catch (error) {
    return handleError(error)
  }
}

// PATCH /api/tournaments/[id]/rounds/[roundId]/games/[gameId] - Update a game
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
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

    const tournament = round.tournaments
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
            club_a:clubs!club_a_id (id, name),
            club_b:clubs!club_b_id (id, name)
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
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

    const tournament = round.tournaments
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