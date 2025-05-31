import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import {
  getAllTournamentsWithDates,
  getAllTournamentsForDisplay,
  getTournamentSummaries,
  searchTournaments,
  transformTournamentToDisplay,
  transformTournamentToSummary,
  filterTournamentsByStatus
} from '@/lib/tournamentUtils'
import { validateTournamentQuery } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = validateTournamentQuery(searchParams)
    
    // Handle search first if provided
    if (queryParams.search) {
      const searchResults = await searchTournaments(supabase, queryParams.search, queryParams.limit * queryParams.page)
      
      // Apply format transformation
      if (queryParams.format === 'display') {
        const transformedResults = searchResults.map(tournament => {
          // For search results, we need to add tournament_dates property
          const tournamentWithDates = {
            ...tournament,
            tournament_dates: [] // Search doesn't return dates, would need separate query
          }
          return transformTournamentToDisplay(tournamentWithDates)
        })
        return apiSuccess(transformedResults)
      } else if (queryParams.format === 'summary') {
        const transformedResults = searchResults.map(tournament => {
          const tournamentWithDates = {
            ...tournament,
            tournament_dates: []
          }
          return transformTournamentToSummary(tournamentWithDates)
        })
        return apiSuccess(transformedResults)
      }
      
      return apiSuccess(searchResults)
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