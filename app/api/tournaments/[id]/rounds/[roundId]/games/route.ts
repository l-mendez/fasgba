import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

// Validation schemas
const gameResultSchema = z.enum(['1-0', '0-1', '1/2-1/2', '*'])

const individualGameSchema = z.object({
  white_player_id: z.number().int().positive('Invalid white player ID'),
  black_player_id: z.number().int().positive('Invalid black player ID'),
  board_number: z.number().int().min(1, 'Board number must be at least 1').optional(),
  result: gameResultSchema.default('*'),
  pgn: z.string().max(10000, 'PGN too long').optional(),
  fen: z.string().max(200, 'FEN too long').optional(),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  game_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
})

const matchGameSchema = z.object({
  match_id: z.number().int().positive('Invalid match ID'),
  white_player_id: z.number().int().positive('Invalid white player ID'),
  black_player_id: z.number().int().positive('Invalid black player ID'),
  board_number: z.number().int().min(1, 'Board number must be at least 1'),
  result: gameResultSchema.default('*'),
  pgn: z.string().max(10000, 'PGN too long').optional(),
  fen: z.string().max(200, 'FEN too long').optional(),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  game_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
})

const updateGameSchema = z.object({
  result: gameResultSchema.optional(),
  pgn: z.string().max(10000, 'PGN too long').optional(),
  fen: z.string().max(200, 'FEN too long').optional(),
  game_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  game_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
    roundId: string
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

// GET /api/tournaments/[id]/rounds/[roundId]/games - Get all games for a round
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId, roundId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
    }

    // Check if tournament and round exist
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
      // Get team match games
      const { data: games, error } = await serverSupabase
        .from('match_games')
        .select(`
          *,
          matches (
            id,
            club_a:clubs!club_a_id (id, name),
            club_b:clubs!club_b_id (id, name)
          ),
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .eq('matches.round_id', roundIdNum)

      if (error) {
        console.error('Error fetching team games:', error)
        throw new Error('Failed to fetch team games')
      }

      return apiSuccess({ 
        games: games || [], 
        tournament_type: 'team',
        round: {
          id: round.id,
          round_number: round.round_number,
          tournament_id: tournamentIdNum
        }
      })
    } else {
      // Get individual games
      const { data: games, error } = await serverSupabase
        .from('individual_games')
        .select(`
          *,
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .eq('round_id', roundIdNum)

      if (error) {
        console.error('Error fetching individual games:', error)
        throw new Error('Failed to fetch individual games')
      }

      return apiSuccess({ 
        games: games || [], 
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

// POST /api/tournaments/[id]/rounds/[roundId]/games - Create a new game
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId, roundId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
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

    // Check if tournament and round exist
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
      // Create team match game
      const validatedData = matchGameSchema.parse(body)
      
      const { data: newGame, error: createError } = await serverSupabase
        .from('match_games')
        .insert([{
          ...validatedData,
          // match_id is provided in the request body
        }])
        .select(`
          *,
          matches (
            id,
            club_a:clubs!club_a_id (id, name),
            club_b:clubs!club_b_id (id, name)
          ),
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .single()

      if (createError) {
        console.error('Error creating team game:', createError)
        throw new Error('Failed to create team game')
      }

      return apiSuccess(newGame, 201)
    } else {
      // Create individual game
      const validatedData = individualGameSchema.parse(body)
      
      const { data: newGame, error: createError } = await serverSupabase
        .from('individual_games')
        .insert([{
          ...validatedData,
          round_id: roundIdNum,
        }])
        .select(`
          *,
          white_player:players!white_player_id (id, full_name, fide_id, rating),
          black_player:players!black_player_id (id, full_name, fide_id, rating)
        `)
        .single()

      if (createError) {
        console.error('Error creating individual game:', createError)
        throw new Error('Failed to create individual game')
      }

      return apiSuccess(newGame, 201)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
} 