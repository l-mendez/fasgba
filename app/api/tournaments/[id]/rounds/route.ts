import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

// Validation schemas
const roundSchema = z.object({
  round_number: z.number().int().min(1, 'Round number must be at least 1').max(20, 'Too many rounds'),
})

interface RouteParams {
  params: Promise<{
    id: string
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

// GET /api/tournaments/[id]/rounds - Get all rounds for a tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Get all rounds for the tournament
    const { data: rounds, error } = await serverSupabase
      .from('rounds')
      .select('*')
      .eq('tournament_id', tournamentIdNum)
      .order('round_number', { ascending: true })

    if (error) {
      console.error('Error fetching rounds:', error)
      throw new Error('Failed to fetch tournament rounds')
    }

    // Calculate total rounds count
    const totalRounds = rounds ? rounds.length : 0

    return apiSuccess({ 
      rounds: rounds || [], 
      totalRounds,
      tournament_id: tournamentIdNum,
      tournament_type: tournament.tournament_type 
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/tournaments/[id]/rounds - Create a new round for a tournament
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
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
    const validatedData = roundSchema.parse(body)

    // Check if tournament exists (already done in auth, but keeping for consistency)
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Check if round number already exists for this tournament
    const { data: existingRound, error: checkError } = await serverSupabase
      .from('rounds')
      .select('id')
      .eq('tournament_id', tournamentIdNum)
      .eq('round_number', validatedData.round_number)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing round:', checkError)
      throw new Error('Failed to check existing round')
    }

    if (existingRound) {
      return validationError(`Round ${validatedData.round_number} already exists for this tournament`)
    }

    // Create the round
    const { data: newRound, error: createError } = await serverSupabase
      .from('rounds')
      .insert([{
        tournament_id: tournamentIdNum,
        round_number: validatedData.round_number
      }])
      .select()
      .single()

    if (createError) {
      console.error('Error creating round:', createError)
      throw new Error('Failed to create round')
    }

    return apiSuccess(newRound, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
}

// DELETE /api/tournaments/[id]/rounds - Delete all rounds for a tournament
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
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

    // Delete all rounds for the tournament (this will cascade to delete games and matches)
    const { error: deleteError } = await serverSupabase
      .from('rounds')
      .delete()
      .eq('tournament_id', tournamentIdNum)

    if (deleteError) {
      console.error('Error deleting rounds:', deleteError)
      throw new Error('Failed to delete tournament rounds')
    }

    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 