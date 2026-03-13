import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin(request)
    const { userId } = await params

    const body = await request.json()
    const { isAdmin, clubAdminIds } = body

    if (typeof isAdmin !== 'boolean' || !Array.isArray(clubAdminIds)) {
      return validationError('isAdmin (boolean) y clubAdminIds (number[]) son requeridos')
    }

    const supabase = createAdminClient()

    // 1. Update admin status
    if (isAdmin) {
      const { error } = await supabase
        .from('admins')
        .upsert({ auth_id: userId }, { onConflict: 'auth_id' })
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('auth_id', userId)
      if (error) throw error
    }

    // 2. Sync club admin relationships
    const { data: currentClubAdmins } = await supabase
      .from('club_admins')
      .select('club_id')
      .eq('auth_id', userId)

    const currentIds = (currentClubAdmins || []).map((ca: any) => ca.club_id)
    const toAdd = clubAdminIds.filter((id: number) => !currentIds.includes(id))
    const toRemove = currentIds.filter((id: number) => !clubAdminIds.includes(id))

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('club_admins')
        .delete()
        .eq('auth_id', userId)
        .in('club_id', toRemove)
      if (error) throw error
    }

    if (toAdd.length > 0) {
      const { error } = await supabase
        .from('club_admins')
        .insert(toAdd.map((club_id: number) => ({ auth_id: userId, club_id })))
      if (error) throw error
    }

    return apiSuccess({ message: 'Permisos actualizados correctamente' })
  } catch (error) {
    return handleError(error)
  }
}
