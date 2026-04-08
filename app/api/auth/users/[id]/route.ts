import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(request, 10, 60_000)
    if (limited) return limited

    const user = await requireAdmin(request)
    const { id: userId } = await params

    if (user.id === userId) {
      return validationError('No puedes eliminar tu propia cuenta')
    }

    const supabase = createAdminClient()

    const { data: userToDelete, error: getUserError } = await supabase.auth.admin.getUserById(userId)

    if (getUserError || !userToDelete.user) {
      return validationError('Usuario no encontrado')
    }

    // Clean up related data
    await Promise.all([
      supabase.from('admins').delete().eq('auth_id', userId),
      supabase.from('club_admins').delete().eq('auth_id', userId),
      supabase.from('user_follows_club').delete().eq('auth_id', userId),
      supabase.from('news').update({ created_by_auth_id: null }).eq('created_by_auth_id', userId),
      supabase.from('elohistory').delete().eq('auth_id', userId),
    ])

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw new Error('Error al eliminar el usuario')
    }

    return apiSuccess({
      success: true,
      message: `Usuario ${userToDelete.user.email} eliminado correctamente`,
    })
  } catch (error) {
    return handleError(error)
  }
}
