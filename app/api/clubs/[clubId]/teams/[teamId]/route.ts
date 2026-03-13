import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { updateTeamSchema } from '@/lib/schemas/teamSchemas'
import { isUserClubAdmin } from '@/lib/clubUtils'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

interface RouteParams {
  params: Promise<{
    clubId: string
    teamId: string
  }>
}

async function authenticateAndAuthorizeClub(request: NextRequest, clubId: number) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }
  const token = authHeader.substring(7)
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  const { data: admin } = await serverSupabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', user.id)
    .single()

  if (admin) return { user, isSiteAdmin: true }

  const isClubAdmin = await isUserClubAdmin(clubId, user.id)
  if (!isClubAdmin) throw new Error('FORBIDDEN')

  return { user, isSiteAdmin: false }
}

// GET /api/clubs/[clubId]/teams/[teamId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId, teamId } = await params
    const clubIdNum = parseInt(clubId, 10)
    const teamIdNum = parseInt(teamId, 10)

    if (isNaN(clubIdNum) || clubIdNum <= 0) return validationError('Invalid club ID')
    if (isNaN(teamIdNum) || teamIdNum <= 0) return validationError('Invalid team ID')

    const { data: team, error } = await serverSupabase
      .from('teams')
      .select('id, name, club_id, created_at, clubs(id, name)')
      .eq('id', teamIdNum)
      .eq('club_id', clubIdNum)
      .single()

    if (error || !team) {
      return notFoundError('Team not found')
    }

    return apiSuccess(team)
  } catch (error) {
    return handleError(error)
  }
}

// PATCH /api/clubs/[clubId]/teams/[teamId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId, teamId } = await params
    const clubIdNum = parseInt(clubId, 10)
    const teamIdNum = parseInt(teamId, 10)

    if (isNaN(clubIdNum) || clubIdNum <= 0) return validationError('Invalid club ID')
    if (isNaN(teamIdNum) || teamIdNum <= 0) return validationError('Invalid team ID')

    let authResult
    try {
      authResult = await authenticateAndAuthorizeClub(request, clubIdNum)
    } catch (authError) {
      if (authError instanceof Error) {
        if (authError.message === 'UNAUTHORIZED') return unauthorizedError('Authentication required')
        if (authError.message === 'FORBIDDEN') return forbiddenError('No tienes permisos para gestionar este equipo')
      }
      throw authError
    }

    const body = await request.json()
    let validated
    try {
      validated = updateTeamSchema.parse(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return validationError(msg)
      }
      throw err
    }

    // Only site admins can change club_id
    if (validated.club_id && !authResult.isSiteAdmin) {
      return forbiddenError('Solo los administradores del sitio pueden cambiar el club de un equipo')
    }

    const updateData: Record<string, unknown> = {}
    if (validated.name) updateData.name = validated.name
    if (validated.club_id) updateData.club_id = validated.club_id

    const { data: team, error } = await serverSupabase
      .from('teams')
      .update(updateData)
      .eq('id', teamIdNum)
      .eq('club_id', clubIdNum)
      .select('id, name, club_id, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return validationError('Ya existe un equipo con ese nombre en este club')
      }
      console.error('Error updating team:', error)
      throw new Error('Failed to update team')
    }

    if (!team) {
      return notFoundError('Team not found')
    }

    return apiSuccess(team)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/clubs/[clubId]/teams/[teamId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clubId, teamId } = await params
    const clubIdNum = parseInt(clubId, 10)
    const teamIdNum = parseInt(teamId, 10)

    if (isNaN(clubIdNum) || clubIdNum <= 0) return validationError('Invalid club ID')
    if (isNaN(teamIdNum) || teamIdNum <= 0) return validationError('Invalid team ID')

    try {
      await authenticateAndAuthorizeClub(request, clubIdNum)
    } catch (authError) {
      if (authError instanceof Error) {
        if (authError.message === 'UNAUTHORIZED') return unauthorizedError('Authentication required')
        if (authError.message === 'FORBIDDEN') return forbiddenError('No tienes permisos para gestionar este equipo')
      }
      throw authError
    }

    // Check team exists and belongs to club
    const { data: team, error: teamError } = await serverSupabase
      .from('teams')
      .select('id')
      .eq('id', teamIdNum)
      .eq('club_id', clubIdNum)
      .single()

    if (teamError || !team) {
      return notFoundError('Team not found')
    }

    const { error } = await serverSupabase
      .from('teams')
      .delete()
      .eq('id', teamIdNum)

    if (error) {
      console.error('Error deleting team:', error)
      throw new Error('Failed to delete team')
    }

    return apiSuccess({ message: 'Team deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}
