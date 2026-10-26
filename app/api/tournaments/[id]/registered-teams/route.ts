import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tournaments/[id]/registered-teams - Get all registered teams for a tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    // Check if tournament exists and is a team tournament
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type, title')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    // Get registered teams for this tournament
    const { data: teams, error } = await serverSupabase
      .from('tournament_teams')
      .select(`
        tournament_id,
        team_id,
        teams (
          id,
          name,
          club_id,
          clubs (
            id,
            name
          )
        )
      `)
      .eq('tournament_id', tournamentIdNum)
      .order('teams(name)', { ascending: true })

    if (error) {
      console.error('Error fetching registered teams:', error)
      throw new Error('Failed to fetch registered teams')
    }

    return apiSuccess({ 
      teams: teams || [],
      tournament: {
        id: tournament.id,
        title: tournament.title,
        tournament_type: tournament.tournament_type
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/tournaments/[id]/registered-teams - Register a team for a tournament
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    const body = await request.json()
    const { team_id } = body

    if (!team_id || isNaN(parseInt(team_id)) || parseInt(team_id) <= 0) {
      return validationError('Valid team ID is required')
    }

    const teamIdNum = parseInt(team_id)

    // Check if tournament exists and is a team tournament
    const { data: tournament, error: tournamentError } = await serverSupabase
      .from('tournaments')
      .select('id, tournament_type')
      .eq('id', tournamentIdNum)
      .single()

    if (tournamentError || !tournament) {
      return notFoundError(ERROR_MESSAGES.TOURNAMENT_NOT_FOUND)
    }

    if (tournament.tournament_type !== 'team') {
      return validationError('This endpoint is only for team tournaments')
    }

    // Check if team exists
    const { data: team, error: teamError } = await serverSupabase
      .from('teams')
      .select('id, name, club_id, clubs(id, name)')
      .eq('id', teamIdNum)
      .single()

    if (teamError || !team) {
      return notFoundError('Team not found')
    }

    // Check if team is already registered
    const { data: existingRegistration } = await serverSupabase
      .from('tournament_teams')
      .select('tournament_id, team_id')
      .eq('tournament_id', tournamentIdNum)
      .eq('team_id', teamIdNum)
      .single()

    if (existingRegistration) {
      return validationError('Este equipo ya está registrado en el torneo')
    }

    // Register the team
    const { data: newRegistration, error: registrationError } = await serverSupabase
      .from('tournament_teams')
      .insert([{
        tournament_id: tournamentIdNum,
        team_id: teamIdNum
      }])
      .select(`
        tournament_id,
        team_id,
        teams (
          id,
          name,
          club_id,
          clubs (
            id,
            name
          )
        )
      `)
      .single()

    if (registrationError) {
      console.error('Error registering team:', registrationError)
      throw new Error('Failed to register team for tournament')
    }

    return apiSuccess(newRegistration, 201)
  } catch (error) {
    return handleError(error)
  }
} 