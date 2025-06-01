import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTournamentById, getAllTournamentsWithDates, transformTournamentToDisplay, updateTournament, deleteTournament } from '@/lib/tournamentUtils'
import { validateTournamentId, validateSingleTournamentQuery, validateUpdateTournament } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, noContent } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tournamentId = validateTournamentId(params.id)
    const { searchParams } = new URL(request.url)
    const queryParams = validateSingleTournamentQuery(searchParams)
    
    if (queryParams.format === 'display') {
      // For display format, we need to get tournament with dates and transform it
      const tournamentsWithDates = await getAllTournamentsWithDates(serverSupabase)
      const tournamentWithDates = tournamentsWithDates.find(t => t.id === tournamentId)
      
      if (!tournamentWithDates) {
        return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
      }
      
      const displayTournament = transformTournamentToDisplay(tournamentWithDates)
      return apiSuccess(displayTournament)
    }
    
    // Default format: raw
    const tournament = await getTournamentById(serverSupabase, tournamentId)
    
    if (!tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    return apiSuccess(tournament)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await serverSupabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return unauthorizedError('Admin access required')
    }

    const tournamentId = validateTournamentId(params.id)
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateUpdateTournament(body)

    // Update the tournament
    const success = await updateTournament(serverSupabase, tournamentId, validatedData)
    
    if (!success) {
      const updateError = new Error('Failed to update tournament')
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await serverSupabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return unauthorizedError('Admin access required')
    }

    const tournamentId = validateTournamentId(params.id)
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    // Delete the tournament
    const success = await deleteTournament(serverSupabase, tournamentId)
    
    if (!success) {
      const deleteError = new Error('Failed to delete tournament')
      deleteError.name = 'DatabaseError'
      throw deleteError
    }
    
    return noContent()
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await serverSupabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return unauthorizedError('Admin access required')
    }

    const tournamentId = validateTournamentId(params.id)
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateUpdateTournament(body)

    // Update the tournament using the same logic as PUT
    const success = await updateTournament(serverSupabase, tournamentId, validatedData)
    
    if (!success) {
      const updateError = new Error('Failed to update tournament')
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 