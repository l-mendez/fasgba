import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, notFoundError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

// GET /api/clubs/[clubId]/players - Get all players from a club
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { clubId } = await params
    const clubIdNum = parseInt(clubId, 10)
    
    if (isNaN(clubIdNum) || clubIdNum <= 0) {
      return validationError('Invalid club ID')
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

    // Get all players from this club
    const { data: players, error: playersError } = await serverSupabase
      .from('players')
      .select(`
        id,
        full_name,
        fide_id,
        rating
      `)
      .eq('club_id', clubIdNum)
      .order('full_name', { ascending: true })

    if (playersError) {
      console.error('Error fetching club players:', playersError)
      throw new Error('Failed to fetch club players')
    }

    return apiSuccess({ 
      players: players || [],
      club: {
        id: club.id,
        name: club.name
      }
    })
  } catch (error) {
    return handleError(error)
  }
} 