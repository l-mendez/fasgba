import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAllTournamentsWithDates,
  getAllTournamentsForDisplay,
  getTournamentSummaries,
  searchTournaments,
  transformTournamentToDisplay,
  transformTournamentToSummary,
  filterTournamentsByStatus,
  createTournament
} from '@/lib/tournamentUtils'
import { validateTournamentQuery, validateCreateTournament } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const queryParams = validateTournamentQuery(searchParams)
    
    // Handle search first if provided
    if (queryParams.search) {
      // For search with format transformations, we need to get tournaments with dates
      if (queryParams.format === 'display' || queryParams.format === 'summary') {
        const allTournamentsWithDates = await getAllTournamentsWithDates(supabase)
        
        // Filter by search term
        const searchResults = allTournamentsWithDates.filter(tournament => 
          tournament.title.toLowerCase().includes(queryParams.search!.toLowerCase()) ||
          (tournament.description && tournament.description.toLowerCase().includes(queryParams.search!.toLowerCase()))
        )
        
        // Apply pagination
        const startIndex = (queryParams.page - 1) * queryParams.limit
        const endIndex = startIndex + queryParams.limit
        const paginatedResults = searchResults.slice(startIndex, endIndex)
        
        if (queryParams.format === 'display') {
          const transformedResults = paginatedResults.map(transformTournamentToDisplay)
          return apiSuccess(transformedResults)
        } else if (queryParams.format === 'summary') {
          const transformedResults = paginatedResults.map(transformTournamentToSummary)
          return apiSuccess(transformedResults)
        }
      } else {
        // For raw format, use the simpler search function
        const searchResults = await searchTournaments(supabase, queryParams.search, queryParams.limit * queryParams.page)
        return apiSuccess(searchResults)
      }
    }
    
    // Handle different response formats
    if (queryParams.format === 'summary') {
      const summaries = await getTournamentSummaries(supabase, queryParams.status, queryParams.limit)
      
      // Apply pagination manually for summaries
      const startIndex = (queryParams.page - 1) * queryParams.limit
      const endIndex = startIndex + queryParams.limit
      const paginatedSummaries = summaries.slice(startIndex, endIndex)
      
      return apiSuccess(paginatedSummaries)
    }
    
    if (queryParams.format === 'display') {
      const tournaments = await getAllTournamentsForDisplay(supabase)
      const filtered = filterTournamentsByStatus(tournaments, queryParams.status)
      
      // Apply pagination
      const startIndex = (queryParams.page - 1) * queryParams.limit
      const endIndex = startIndex + queryParams.limit
      const paginatedTournaments = filtered.slice(startIndex, endIndex)
      
      return apiSuccess(paginatedTournaments)
    }
    
    // Default format: raw
    const tournamentsWithDates = await getAllTournamentsWithDates(supabase)
    
    // For raw format with status filtering, we need to transform temporarily to check status
    let filtered = tournamentsWithDates
    if (queryParams.status !== 'all') {
      const transformedForFiltering = tournamentsWithDates.map(transformTournamentToDisplay)
      const filteredTransformed = filterTournamentsByStatus(transformedForFiltering, queryParams.status)
      // Map back to original format
      filtered = tournamentsWithDates.filter(t => 
        filteredTransformed.some(ft => ft.id === t.id)
      )
    }
    
    // Apply pagination
    const startIndex = (queryParams.page - 1) * queryParams.limit
    const endIndex = startIndex + queryParams.limit
    const paginatedTournaments = filtered.slice(startIndex, endIndex)
    
    return apiSuccess(paginatedTournaments)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateCreateTournament(body)

    // Check if user is site admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isSiteAdmin = !adminError && !!admin

    // If not site admin, check if user is club admin
    if (!isSiteAdmin) {
      // If a club is specified, check if user is admin of that club
      if (validatedData.created_by_club) {
        const isClubAdmin = await isUserClubAdmin(validatedData.created_by_club, user.id)
        if (!isClubAdmin) {
          return forbiddenError('No tienes permisos para crear torneos para este club. Solo los administradores del club pueden crear torneos en su nombre.')
        }
      } else {
        // If no club specified, user must have at least one club they admin
        // Get user's admin clubs to check if they can create tournaments
        const { data: userClubs, error: clubError } = await supabase
          .from('club_admins')
          .select('club_id')
          .eq('auth_id', user.id)

        if (clubError || !userClubs || userClubs.length === 0) {
          return forbiddenError('No tienes permisos para crear torneos. Debes ser administrador del sitio o administrador de al menos un club.')
        }
      }
    }

    // Create the tournament
    const newTournament = await createTournament(supabase, validatedData)
    
    return apiSuccess(newTournament, 201)
  } catch (error) {
    return handleError(error)
  }
} 