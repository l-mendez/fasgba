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