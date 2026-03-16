import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ authId: string }> }
) {
  try {
    await requireAdmin(request)

    const { authId } = await params

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('alumnos')
      .select('auth_id')
      .eq('auth_id', authId)
      .single()

    if (!existing) {
      return notFoundError('Alumno no encontrado')
    }

    const { error } = await supabase
      .from('alumnos')
      .delete()
      .eq('auth_id', authId)

    if (error) {
      return handleError(error)
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
