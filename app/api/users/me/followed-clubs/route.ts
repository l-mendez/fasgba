import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

// Returns the IDs of the clubs the current user follows, in a single request,
// so client lists can render per-user follow state without one call per club.
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_follows_club')
      .select('club_id')
      .eq('auth_id', user.id)

    if (error) throw error

    return apiSuccess({ clubIds: (data ?? []).map((row) => row.club_id) })
  } catch (error) {
    return handleError(error)
  }
}
