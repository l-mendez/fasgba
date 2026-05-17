import { NextRequest, after } from 'next/server'
import { sendBroadcast } from '@/lib/notifications/sendBroadcast'
import { createClient } from '@/lib/supabase/server'
import { createTournament } from '@/lib/tournamentUtils'
import { validateCreateTournament } from '@/lib/schemas/tournamentSchemas'
import { apiSuccess, handleError, unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { isUserClubAdmin } from '@/lib/clubUtils'

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
    
    after(async () => {
      try {
        await sendBroadcast({ type: 'tournament_created', tournamentId: newTournament.id })
      } catch (err) {
        console.error('[tournaments] sendBroadcast failed', err)
      }
    })
    
    return apiSuccess(newTournament, 201)
  } catch (error) {
    return handleError(error)
  }
} 