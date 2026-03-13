import { NextRequest } from 'next/server'
import { requireAuth, isAlumno } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const supabase = createAdminClient()

    // Check admin status
    const { data: adminData } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    const isAdmin = !!adminData

    // Check club admin status
    const { data: clubAdminData, count } = await supabase
      .from('club_admins')
      .select('auth_id, club_id', { count: 'exact' })
      .eq('auth_id', user.id)

    const isClubAdmin = (count || 0) > 0
    const adminClubsCount = count || 0

    // Check alumno status
    const alumno = await isAlumno(user.id)

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
