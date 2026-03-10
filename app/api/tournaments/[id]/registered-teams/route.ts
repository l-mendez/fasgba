import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tournaments/[id]/registered-teams - Get all registered teams for a tournament
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
      .from('tournament_club_teams')
      .select(`
        tournament_id,
        club_id,
        clubs (
          id,
          name
        )
      `)
      .eq('tournament_id', tournamentIdNum)
      .order('clubs(name)', { ascending: true })

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tournamentId } = await params
    const tournamentIdNum = parseInt(tournamentId, 10)
    
    if (isNaN(tournamentIdNum) || tournamentIdNum <= 0) {
      return validationError('Invalid tournament ID')
    }

    const body = await request.json()
    const { club_id } = body

    if (!club_id || isNaN(parseInt(club_id)) || parseInt(club_id) <= 0) {
      return validationError('Valid club ID is required')
    }

    const clubIdNum = parseInt(club_id)

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

    // Check if club exists
    const { data: club, error: clubError } = await serverSupabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubIdNum)
      .single()

    if (clubError || !club) {
      return notFoundError('Club not found')
    }

    // Check if team is already registered
    const { data: existingRegistration } = await serverSupabase
      .from('tournament_club_teams')
      .select('tournament_id, club_id')
      .eq('tournament_id', tournamentIdNum)
      .eq('club_id', clubIdNum)
      .single()

    if (existingRegistration) {
      return validationError('This club is already registered for this tournament')
    }

    // Register the team
    const { data: newRegistration, error: registrationError } = await serverSupabase
      .from('tournament_club_teams')
      .insert([{
        tournament_id: tournamentIdNum,
        club_id: clubIdNum
      }])
      .select(`
        tournament_id,
        club_id,
        clubs (
          id,
          name
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