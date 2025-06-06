import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTournamentById, getAllTournamentsWithDates, transformTournamentToDisplay, updateTournament, deleteTournament } from '@/lib/tournamentUtils'
import { validateTournamentId, validateSingleTournamentQuery, validateUpdateTournament } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, noContent, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { requireAdmin, requireAuth } from '@/lib/middleware/auth'
import { isUserClubAdmin } from '@/lib/clubUtils'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to check if user can edit tournament
async function canUserEditTournament(userId: string, tournamentId: string): Promise<boolean> {
  try {
    // Check if user is site admin
    const { data: adminData, error: adminError } = await serverSupabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', userId)
      .single()

    if (!adminError && adminData) {
      return true // Site admins can edit any tournament
    }

    // Get tournament to check which club created it
    const tournament = await getTournamentById(serverSupabase, tournamentId)
    if (!tournament || !tournament.created_by_club_id) {
      return false // Tournament doesn't exist or wasn't created by a club
    }

    // Check if user is admin of the club that created the tournament
    return await isUserClubAdmin(tournament.created_by_club_id, userId)
  } catch (error) {
    console.error('Error checking tournament edit permissions:', error)
    return false
  }
}

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
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
    // Require authentication
    const user = await requireAuth(request)
    
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Check if user can edit this tournament
    const canEdit = await canUserEditTournament(user.id, tournamentId)
    if (!canEdit) {
      return forbiddenError('No tienes permisos para editar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden editarlo.')
    }
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    const body = await request.json()
    const validatedData = validateUpdateTournament(body)
    
    const success = await updateTournament(serverSupabase, tournamentId, validatedData)
    
    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
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
    // Require authentication
    const user = await requireAuth(request)
    
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Check if user can edit this tournament
    const canEdit = await canUserEditTournament(user.id, tournamentId)
    if (!canEdit) {
      return forbiddenError('No tienes permisos para eliminar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden eliminarlo.')
    }
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    const success = await deleteTournament(serverSupabase, tournamentId)
    
    if (!success) {
      const deleteError = new Error(ERROR_MESSAGES.DELETION_FAILED)
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
    // Require authentication
    const user = await requireAuth(request)
    
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Check if user can edit this tournament
    const canEdit = await canUserEditTournament(user.id, tournamentId)
    if (!canEdit) {
      return forbiddenError('No tienes permisos para editar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden editarlo.')
    }
    
    // Check if tournament exists
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    const body = await request.json()
    const validatedData = validateUpdateTournament(body)
    
    const success = await updateTournament(serverSupabase, tournamentId, validatedData)
    
    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 