import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, unauthorizedError, forbiddenError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// Validation schemas
const playerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  fide_id: z.string().max(20, 'FIDE ID too long').optional(),
  rating: z.number().int().min(0, 'Rating must be positive').max(4000, 'Rating too high').optional(),
  club_id: z.number().int().positive('Invalid club ID').optional(),
})

const updatePlayerSchema = playerSchema.partial()

interface RouteParams {
  params: Promise<{
    id: string
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

// GET /api/tournaments/[id]/players - Get all players in a tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
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

    if (tournament.tournament_type === 'team') {
      // For team tournaments, get players through team registrations
      const { data: players, error } = await serverSupabase
        .from('tournament_team_players')
        .select(`
          players (
            id,
            full_name,
            fide_id,
            rating
          ),
          teams (
            id,
            name,
            clubs (
              id,
              name
            )
          )
        `)
        .eq('tournament_id', tournamentIdNum)

      if (error) {
        console.error('Error fetching team tournament players:', error)
        throw new Error('Failed to fetch tournament players')
      }

      const formattedPlayers = players?.map(p => ({
        ...p.players,
        team: p.teams,
        club: p.teams?.clubs
      })) || []

      return apiSuccess({ players: formattedPlayers, tournament_type: 'team' })
    } else {
      // For individual tournaments, get players from tournament_registrations
      const { data: registrations, error } = await serverSupabase
        .from('tournament_registrations')
        .select(`
          players (
            id,
            full_name,
            fide_id,
            rating,
            club:clubs!players_club_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('tournament_id', tournamentIdNum)

      if (error) {
        console.error('Error fetching individual tournament players:', error)
        throw new Error('Failed to fetch tournament players')
      }

      const players = registrations?.map(r => {
        const player = r.players
        return player ? {
          id: player.id,
          full_name: player.full_name,
          fide_id: player.fide_id,
          rating: player.rating,
          club: player.club
        } : null
      }).filter(Boolean) || []
      return apiSuccess({ players, tournament_type: 'individual' })
    }
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/tournaments/[id]/players - Add a player to a tournament
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Authenticate and authorize user
    let user
    try {
      user = await authenticateAndAuthorize(request, tournamentIdNum)
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
    const validatedData = playerSchema.parse(body)

    // Check if tournament exists (already done in auth, but keeping for consistency)
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Create or find the player
    let player
    if (validatedData.fide_id) {
      // Try to find existing player by FIDE ID
      const { data: existingPlayer } = await serverSupabase
        .from('players')
        .select('*')
        .eq('fide_id', validatedData.fide_id)
        .single()

      if (existingPlayer) {
        player = existingPlayer
      }
    }

    if (!player) {
      // Create new player
      const { data: newPlayer, error: playerError } = await serverSupabase
        .from('players')
        .insert([validatedData])
        .select()
        .single()

      if (playerError) {
        console.error('Error creating player:', playerError)
        throw new Error('Failed to create player')
      }
      player = newPlayer
    }

    // Register player based on tournament type
    if (tournament.tournament_type === 'individual') {
      // For individual tournaments, register the player in tournament_registrations
      const { data: existingRegistration } = await serverSupabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentIdNum)
        .eq('player_id', player.id)
        .single()

      if (!existingRegistration) {
        // Register the player for the tournament
        const { error: registrationError } = await serverSupabase
          .from('tournament_registrations')
          .insert([{
            tournament_id: tournamentIdNum,
            player_id: player.id
          }])

        if (registrationError) {
          console.error('Error registering player for tournament:', registrationError)
          throw new Error('Failed to register player for tournament')
        }
      }
    } else if (tournament.tournament_type === 'team') {
      // For team tournaments, we need a team_id from the request body
      const teamId = body.team_id
      if (!teamId) {
        throw new Error('Team ID is required for team tournaments')
      }

      const teamIdNum = parseInt(teamId)

      // Verify that the team exists and get its club
      const { data: team, error: teamError } = await serverSupabase
        .from('teams')
        .select('id, club_id')
        .eq('id', teamIdNum)
        .single()

      if (teamError || !team) {
        throw new Error('Team not found')
      }

      // Verify that the user has permission to add players to this team's club
      const { data: admin, error: adminError } = await serverSupabase
        .from('admins')
        .select('auth_id')
        .eq('auth_id', user.id)
        .single()

      const isSiteAdmin = !adminError && !!admin

      if (!isSiteAdmin) {
        const isClubAdmin = await isUserClubAdmin(team.club_id, user.id)
        if (!isClubAdmin) {
          throw new Error('You do not have permission to add players to this team')
        }
      }

      // First, ensure the team is registered for this tournament
      const { data: existingTeamReg } = await serverSupabase
        .from('tournament_teams')
        .select('tournament_id, team_id')
        .eq('tournament_id', tournamentIdNum)
        .eq('team_id', teamIdNum)
        .single()

      if (!existingTeamReg) {
        const { error: teamRegistrationError } = await serverSupabase
          .from('tournament_teams')
          .insert([{
            tournament_id: tournamentIdNum,
            team_id: teamIdNum
          }])

        if (teamRegistrationError) {
          console.error('Error registering team:', teamRegistrationError)
          throw new Error('Failed to register team for tournament')
        }
      }

      // Check if player is already registered for this tournament
      const { data: existingPlayerRegistration } = await serverSupabase
        .from('tournament_team_players')
        .select('tournament_id, player_id')
        .eq('tournament_id', tournamentIdNum)
        .eq('player_id', player.id)
        .single()

      if (!existingPlayerRegistration) {
        const { error: playerRegistrationError } = await serverSupabase
          .from('tournament_team_players')
          .insert([{
            tournament_id: tournamentIdNum,
            team_id: teamIdNum,
            player_id: player.id
          }])

        if (playerRegistrationError) {
          console.error('Error registering player for team tournament:', playerRegistrationError)
          throw new Error('Failed to register player for team tournament')
        }
      }
    }

    return apiSuccess(player, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
}

// DELETE /api/tournaments/[id]/players - Remove a player from a tournament
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Authenticate and authorize user
    let user
    try {
      user = await authenticateAndAuthorize(request, tournamentIdNum)
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
    const { player_id } = body

    if (!player_id || isNaN(parseInt(player_id)) || parseInt(player_id) <= 0) {
      return validationError('Valid player ID is required')
    }

    const playerIdNum = parseInt(player_id)

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    // Check if player exists
    const { data: player, error: playerError } = await serverSupabase
      .from('players')
      .select('id, full_name')
      .eq('id', playerIdNum)
      .single()

    if (playerError || !player) {
      return notFoundError('Player not found')
    }

    let gamesDeleted = 0

    // Delete all games where this player participated
    if (tournament.tournament_type === 'team') {
      // For team tournaments, delete from match_games
      const { data: playerGames, error: gamesError } = await serverSupabase
        .from('match_games')
        .select(`
          id,
          match_id,
          matches!inner(
            round_id,
            rounds!inner(tournament_id)
          )
        `)
        .eq('matches.rounds.tournament_id', tournamentIdNum)
        .or(`white_player_id.eq.${playerIdNum},black_player_id.eq.${playerIdNum}`)

      if (gamesError) {
        console.error('Error finding player games:', gamesError)
        throw new Error('Failed to find player games')
      }

      if (playerGames && playerGames.length > 0) {
        const gameIds = playerGames.map(game => game.id)
        
        const { error: deleteGamesError } = await serverSupabase
          .from('match_games')
          .delete()
          .in('id', gameIds)

        if (deleteGamesError) {
          console.error('Error deleting player games:', deleteGamesError)
          throw new Error('Failed to delete player games')
        }

        gamesDeleted = gameIds.length
      }

      // Remove player from team tournament
      const { error: teamPlayerDeleteError } = await serverSupabase
        .from('tournament_team_players')
        .delete()
        .eq('tournament_id', tournamentIdNum)
        .eq('player_id', playerIdNum)

      if (teamPlayerDeleteError) {
        console.error('Error removing player from team tournament:', teamPlayerDeleteError)
        throw new Error('Failed to remove player from team tournament')
      }
    } else {
      // For individual tournaments, delete from individual_games
      const { data: playerGames, error: gamesError } = await serverSupabase
        .from('individual_games')
        .select(`
          id,
          round_id,
          rounds!inner(tournament_id)
        `)
        .eq('rounds.tournament_id', tournamentIdNum)
        .or(`white_player_id.eq.${playerIdNum},black_player_id.eq.${playerIdNum}`)

      if (gamesError) {
        console.error('Error finding player games:', gamesError)
        throw new Error('Failed to find player games')
      }

      if (playerGames && playerGames.length > 0) {
        const gameIds = playerGames.map(game => game.id)
        
        const { error: deleteGamesError } = await serverSupabase
          .from('individual_games')
          .delete()
          .in('id', gameIds)

        if (deleteGamesError) {
          console.error('Error deleting player games:', deleteGamesError)
          throw new Error('Failed to delete player games')
        }

        gamesDeleted = gameIds.length
      }

      // Remove player from individual tournament
      const { error: registrationDeleteError } = await serverSupabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentIdNum)
        .eq('player_id', playerIdNum)

      if (registrationDeleteError) {
        console.error('Error removing player registration:', registrationDeleteError)
        throw new Error('Failed to remove player from tournament')
      }
    }

    return apiSuccess({ 
      message: 'Player removed from tournament successfully',
      details: {
        player_name: player.full_name,
        games_deleted: gamesDeleted,
        tournament_type: tournament.tournament_type
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return validationError(`Validation error: ${errorMessage}`)
    }
    return handleError(error)
  }
} 