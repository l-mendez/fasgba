import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'

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

// Helper function to authenticate and authorize user for tournament operations
async function authenticateAndAuthorize(request: NextRequest, tournamentId: number) {
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

// GET /api/tournaments/[id]/rounds/[roundId] - Get a specific round
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

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, title')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Get the specific round
    const { data: round, error } = await serverSupabase
      .from('rounds')
      .select('*')
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (error || !round) {
      return notFoundError('Round not found')
    }

    return apiSuccess({ 
      round,
      tournament: {
        id: tournament.id,
        title: tournament.title
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/tournaments/[id]/rounds/[roundId] - Delete a specific round
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if tournament exists (already done in auth, but keeping for consistency)
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Check if round exists and belongs to the tournament
    const { data: round, error: roundError } = await serverSupabase
      .from('rounds')
      .select('id, round_number')
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)
      .single()

    if (roundError || !round) {
      return notFoundError('Round not found')
    }

    // Delete the round (this will cascade to delete games and matches)
    const { error: deleteError } = await serverSupabase
      .from('rounds')
      .delete()
      .eq('id', roundIdNum)
      .eq('tournament_id', tournamentIdNum)

    if (deleteError) {
      console.error('Error deleting round:', deleteError)
      throw new Error('Failed to delete round')
    }

    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 