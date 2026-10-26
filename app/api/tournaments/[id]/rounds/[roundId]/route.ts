import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { handleError, notFoundError, validationError, noContent, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { authenticateAndAuthorize } from '@/lib/middleware/tournamentAuth'

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