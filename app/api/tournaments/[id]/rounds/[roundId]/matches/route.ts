// @ts-nocheck
/* eslint-disable */
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, unauthorizedError, forbiddenError, noContent } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { z } from 'zod'
import { isUserClubAdmin } from '@/lib/clubUtils'

// @ts-nocheck
// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    id: string
    roundId: string
  }>
}

// Validation schema for new match
const createMatchSchema = z.object({
  club_a_id: z.number().int().positive('Invalid club A ID'),
  club_b_id: z.number().int().positive('Invalid club B ID')
}).refine(data => data.club_a_id !== data.club_b_id, {
  message: 'Los dos clubes deben ser diferentes',
  path: ['club_b_id']
})

// Helper auth function similar to games route
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

  // If not site admin, must be club admin of tournament club (or of at least one club if no club)
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

// GET /api/tournaments/[id]/rounds/[roundId]/matches - Get all matches for a round
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
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

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    // Get matches for the round
    const { data: matches, error } = await serverSupabase
      .from('matches')
      .select(`
        id,
        club_a:clubs!club_a_id (id, name),
        club_b:clubs!club_b_id (id, name)
      `)
      .eq('round_id', roundIdNum)

    if (error) {
      console.error('Error fetching matches:', error)
      throw new Error('Failed to fetch matches')
    }

    return apiSuccess({ 
      matches: matches || [], 
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

// POST /api/tournaments/[id]/rounds/[roundId]/matches - Create a new match
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId, roundId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    const roundIdNum = parseInt(roundId, 10)

    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }
    if (isNaN(roundIdNum) || roundIdNum <= 0) {
      return validationError('Invalid round ID')
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
      validated = createMatchSchema.parse(body)
    } catch (zErr) {
      if (zErr instanceof z.ZodError) {
        const msg = zErr.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return validationError(`Validation error: ${msg}`)
      }
      throw zErr
    }

    // Ensure round belongs to team tournament
    const { data: round, error: roundErr } = await serverSupabase
      .from('rounds')
      .select('id, tournaments(id, tournament_type)')
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (roundErr || !round) {
      return notFoundError('Round not found')
    }

    if (round.tournaments?.tournament_type !== 'team') {
      return validationError('Matches sólo permitidos en torneos por equipos')
    }

    // Insert match
    const { data: newMatch, error: insertErr } = await serverSupabase
      .from('matches')
      .insert([{ round_id: roundIdNum, club_a_id: validated.club_a_id, club_b_id: validated.club_b_id }])
      .select('id, club_a:clubs!club_a_id(id, name), club_b:clubs!club_b_id(id, name)')
      .single()

    if (insertErr) {
      console.error('Error creating match:', insertErr)
      throw new Error('Failed to create match')
    }

    return apiSuccess(newMatch, 201)
  } catch (error) {
    return handleError(error)
  }
} 