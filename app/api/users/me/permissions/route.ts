import { NextRequest } from 'next/server'
import { requireAuth, isAlumno } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = createAdminClient()

    // requireAuth already resolved admin status; fetch the remaining roles in parallel.
    const isAdmin = user.permissions?.isAdmin ?? false
    const [{ data: clubAdminData, count }, alumno] = await Promise.all([
      supabase.from('club_admins').select('auth_id, club_id', { count: 'exact' }).eq('auth_id', user.id),
      isAlumno(user.id),
    ])

    const adminClubsCount = count || 0
    const isClubAdmin = adminClubsCount > 0

    return apiSuccess({
      isAdmin,
      isClubAdmin,
      adminClubsCount,
      isAlumno: alumno,
      clubAdminClubs: clubAdminData || [],
      canEditProfile: true,
      canViewAdmin: isAdmin,
      canManageUsers: isAdmin,
      canManageContent: isAdmin,
    })
  } catch (error) {
    return handleError(error)
  }
}
