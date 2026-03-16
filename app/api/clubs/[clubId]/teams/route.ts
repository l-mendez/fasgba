import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { createTeamSchema } from '@/lib/schemas/teamSchemas'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

// GET /api/clubs/[clubId]/teams - Get all teams for a club
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId } = await params
    const clubIdNum = parseInt(clubId, 10)

    if (isNaN(clubIdNum) || clubIdNum <= 0) {
      return validationError('Invalid club ID')
    }

    const { data: club, error: clubError } = await serverSupabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubIdNum)
      .single()

    if (clubError || !club) {
      return notFoundError('Club not found')
    }

    const { data: teams, error } = await serverSupabase
      .from('teams')
      .select('id, name, club_id, created_at')
      .eq('club_id', clubIdNum)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching club teams:', error)
      throw new Error('Failed to fetch club teams')
    }

    return apiSuccess({
      teams: teams || [],
      club: { id: club.id, name: club.name }
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/clubs/[clubId]/teams - Create a team for a club
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId } = await params
    const clubIdNum = parseInt(clubId, 10)

    if (isNaN(clubIdNum) || clubIdNum <= 0) {
      return validationError('Invalid club ID')
    }

    // Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError('Authentication required')
    }
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
    if (authError || !user) {
      return unauthorizedError('Invalid token')
    }

    // Check site admin
    const { data: admin } = await serverSupabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isSiteAdmin = !!admin
    if (!isSiteAdmin) {
      const isClubAdmin = await isUserClubAdmin(clubIdNum, user.id)
      if (!isClubAdmin) {
        return forbiddenError('No tienes permisos para gestionar equipos de este club')
      }
    }

    // Check club exists
    const { data: club, error: clubError } = await serverSupabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubIdNum)
      .single()

    if (clubError || !club) {
      return notFoundError('Club not found')
    }

    // Validate body
    const body = await request.json()
    let validated
    try {
      validated = createTeamSchema.parse(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return validationError(msg)
      }
      throw err
    }

    // Insert team
    const { data: team, error } = await serverSupabase
      .from('teams')
      .insert({ name: validated.name, club_id: clubIdNum })
      .select('id, name, club_id, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return validationError('Ya existe un equipo con ese nombre en este club')
      }
      console.error('Error creating team:', error)
      throw new Error('Failed to create team')
    }

    return apiSuccess(team, 201)
  } catch (error) {
    return handleError(error)
  }
}
