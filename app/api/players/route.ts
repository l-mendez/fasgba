import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/players - Get all players
export async function GET(request: NextRequest) {
  try {
    // Get all players with their club information
    const { data: players, error: playersError } = await serverSupabase
      .from('players')
      .select(`
        id,
        full_name,
        fide_id,
        rating,
        club:clubs!players_club_id_fkey (
          id,
          name
        )
      `)
      .order('full_name', { ascending: true })

    if (playersError) {
      console.error('Error fetching players:', playersError)
      throw new Error('Failed to fetch players')
    }

    return apiSuccess({ 
      players: players || []
    })
  } catch (error) {
    return handleError(error)
  }
} 