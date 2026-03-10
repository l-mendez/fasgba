import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTournamentById, getAllTournamentsWithDates, transformTournamentToDisplay, updateTournament, deleteTournament } from '@/lib/tournamentUtils'
import { validateTournamentId, validateSingleTournamentQuery, validateUpdateTournament } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, noContent, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const tournament = await getTournamentById(serverSupabase, tournamentId)
    
    if (!tournament) {
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

// Helper function to check if user can edit tournament
async function canUserEditTournament(userId: string, tournamentId: number): Promise<boolean> {
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Authenticate and authorize user
    try {
      await authenticateAndAuthorize(request, tournamentId)
    } catch (authError) {
      if (authError instanceof Error) {
        switch (authError.message) {
          case 'UNAUTHORIZED':
            return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
          case 'FORBIDDEN':
            return forbiddenError('No tienes permisos para editar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden editarlo.')
          case 'TOURNAMENT_NOT_FOUND':
            return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
          default:
            throw authError
        }
      }
      throw authError
    }
    
    // Check if tournament exists (already done in auth, but keeping for consistency)
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Authenticate and authorize user
    try {
      await authenticateAndAuthorize(request, tournamentId)
    } catch (authError) {
      if (authError instanceof Error) {
        switch (authError.message) {
          case 'UNAUTHORIZED':
            return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
          case 'FORBIDDEN':
            return forbiddenError('No tienes permisos para eliminar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden eliminarlo.')
          case 'TOURNAMENT_NOT_FOUND':
            return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
          default:
            throw authError
        }
      }
      throw authError
    }
    
    // Check if tournament exists (already done in auth, but keeping for consistency)
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: idParam } = await params
    const tournamentId = validateTournamentId(idParam)
    
    // Authenticate and authorize user
    try {
      await authenticateAndAuthorize(request, tournamentId)
    } catch (authError) {
      if (authError instanceof Error) {
        switch (authError.message) {
          case 'UNAUTHORIZED':
            return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
          case 'FORBIDDEN':
            return forbiddenError('No tienes permisos para editar este torneo. Solo los administradores del sitio o del club que creó el torneo pueden editarlo.')
          case 'TOURNAMENT_NOT_FOUND':
            return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
          default:
            throw authError
        }
      }
      throw authError
    }
    
    // Check if tournament exists (already done in auth, but keeping for consistency)
    const existingTournament = await getTournamentById(serverSupabase, tournamentId)
    if (!existingTournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND, `No tournament found with ID ${tournamentId}`)
    }
    
    const body = await request.json()
    const validatedData = validateUpdateTournament(body)
    
    // Check if tournament type is being changed
    const isTypeChanging = validatedData.tournament_type && 
                          validatedData.tournament_type !== existingTournament.tournament_type
    
    let cascadeDetails = null
    
    if (isTypeChanging) {
      console.log(`Tournament type changing from ${existingTournament.tournament_type} to ${validatedData.tournament_type}`)
      
      // Perform cascading deletes based on the current tournament type
      if (existingTournament.tournament_type === 'team') {
        // Changing from team to individual
        // 1. Delete all match games
        const { data: matchGames, error: matchGamesError } = await serverSupabase
          .from('match_games')
          .select(`
            id,
            matches!inner(
              rounds!inner(tournament_id)
            )
          `)
          .eq('matches.rounds.tournament_id', tournamentId)

        let matchGamesDeleted = 0
        if (matchGames && matchGames.length > 0) {
          const gameIds = matchGames.map(game => game.id)
          const { error: deleteMatchGamesError } = await serverSupabase
            .from('match_games')
            .delete()
            .in('id', gameIds)

          if (deleteMatchGamesError) {
            console.error('Error deleting match games:', deleteMatchGamesError)
            throw new Error('Failed to delete match games during type change')
          }
          matchGamesDeleted = gameIds.length
        }

        // 2. Delete all matches
        const { data: matches, error: matchesError } = await serverSupabase
          .from('matches')
          .select(`
            id,
            rounds!inner(tournament_id)
          `)
          .eq('rounds.tournament_id', tournamentId)

        let matchesDeleted = 0
        if (matches && matches.length > 0) {
          const matchIds = matches.map(match => match.id)
          const { error: deleteMatchesError } = await serverSupabase
            .from('matches')
            .delete()
            .in('id', matchIds)

          if (deleteMatchesError) {
            console.error('Error deleting matches:', deleteMatchesError)
            throw new Error('Failed to delete matches during type change')
          }
          matchesDeleted = matchIds.length
        }

        // 3. Delete team registrations (but keep players - they can be re-registered individually)
        const { data: teamRegistrations, error: teamRegError } = await serverSupabase
          .from('tournament_club_teams')
          .select('club_id')
          .eq('tournament_id', tournamentId)

        let teamsDeleted = 0
        if (teamRegistrations && teamRegistrations.length > 0) {
          const { error: deleteTeamsError } = await serverSupabase
            .from('tournament_club_teams')
            .delete()
            .eq('tournament_id', tournamentId)

          if (deleteTeamsError) {
            console.error('Error deleting team registrations:', deleteTeamsError)
            throw new Error('Failed to delete team registrations during type change')
          }
          teamsDeleted = teamRegistrations.length
        }

        // 4. Delete team player registrations (but keep the players in the players table)
        const { data: teamPlayers, error: teamPlayersError } = await serverSupabase
          .from('tournament_team_players')
          .select('player_id')
          .eq('tournament_id', tournamentId)

        let teamPlayersDeleted = 0
        if (teamPlayers && teamPlayers.length > 0) {
          const { error: deleteTeamPlayersError } = await serverSupabase
            .from('tournament_team_players')
            .delete()
            .eq('tournament_id', tournamentId)

          if (deleteTeamPlayersError) {
            console.error('Error deleting team players:', deleteTeamPlayersError)
            throw new Error('Failed to delete team players during type change')
          }
          teamPlayersDeleted = teamPlayers.length
        }

        cascadeDetails = {
          from_type: 'team',
          to_type: 'individual',
          match_games_deleted: matchGamesDeleted,
          matches_deleted: matchesDeleted,
          teams_deleted: teamsDeleted,
          team_players_deleted: teamPlayersDeleted
        }

      } else if (existingTournament.tournament_type === 'individual') {
        // Changing from individual to team
        // 1. Delete all individual games
        const { data: individualGames, error: individualGamesError } = await serverSupabase
          .from('individual_games')
          .select(`
            id,
            rounds!inner(tournament_id)
          `)
          .eq('rounds.tournament_id', tournamentId)

        let individualGamesDeleted = 0
        if (individualGames && individualGames.length > 0) {
          const gameIds = individualGames.map(game => game.id)
          const { error: deleteIndividualGamesError } = await serverSupabase
            .from('individual_games')
            .delete()
            .in('id', gameIds)

          if (deleteIndividualGamesError) {
            console.error('Error deleting individual games:', deleteIndividualGamesError)
            throw new Error('Failed to delete individual games during type change')
          }
          individualGamesDeleted = gameIds.length
        }

        // 2. Delete individual tournament registrations (but keep players - they can be re-registered to teams)
        const { data: individualRegistrations, error: individualRegError } = await serverSupabase
          .from('tournament_registrations')
          .select('player_id')
          .eq('tournament_id', tournamentId)

        let individualRegistrationsDeleted = 0
        if (individualRegistrations && individualRegistrations.length > 0) {
          const { error: deleteIndividualRegError } = await serverSupabase
            .from('tournament_registrations')
            .delete()
            .eq('tournament_id', tournamentId)

          if (deleteIndividualRegError) {
            console.error('Error deleting individual registrations:', deleteIndividualRegError)
            throw new Error('Failed to delete individual registrations during type change')
          }
          individualRegistrationsDeleted = individualRegistrations.length
        }

        cascadeDetails = {
          from_type: 'individual',
          to_type: 'team',
          individual_games_deleted: individualGamesDeleted,
          individual_registrations_deleted: individualRegistrationsDeleted
        }
      }
    }
    
    const success = await updateTournament(serverSupabase, tournamentId, validatedData)
    
    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    const response: any = { success: true }
    if (cascadeDetails) {
      response.cascade_details = cascadeDetails
      response.message = 'Tournament updated successfully. Tournament type change required deletion of existing games and registrations.'
    }
    
    return apiSuccess(response)
  } catch (error) {
    return handleError(error)
  }
} 