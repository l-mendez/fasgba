import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError, conflictError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const supabase = createAdminClient()

    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('auth_id, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return handleError(error)
    }

    // Fetch user details for each alumno
    const alumnosWithDetails = await Promise.all(
      (alumnos || []).map(async (alumno) => {
        const { data: { user } } = await supabase.auth.admin.getUserById(alumno.auth_id)
        return {
          auth_id: alumno.auth_id,
          created_at: alumno.created_at,
          email: user?.email || 'N/A',
          nombre: user?.user_metadata?.nombre || '',
          apellido: user?.user_metadata?.apellido || '',
        }
      })
    )

    return apiSuccess({ alumnos: alumnosWithDetails })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const { auth_id } = body

    if (!auth_id || typeof auth_id !== 'string') {
      return validationError('Se requiere el auth_id del usuario')
    }

    const supabase = createAdminClient()

    // Verify user exists
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(auth_id)

    if (userError || !user) {
      return validationError('Usuario no encontrado')
    }

    // Check if already alumno
    const { data: existing } = await supabase
      .from('alumnos')
      .select('auth_id')
      .eq('auth_id', auth_id)
      .single()

    if (existing) {
      return conflictError('El usuario ya es alumno')
    }

    const { error: insertError } = await supabase
      .from('alumnos')
      .insert({ auth_id })

    if (insertError) {
      return handleError(insertError)
    }

    return apiSuccess({
      success: true,
      alumno: {
        auth_id,
        email: user.email,
        nombre: user.user_metadata?.nombre || '',
        apellido: user.user_metadata?.apellido || '',
      }
    }, 201)
  } catch (error) {
    return handleError(error)
  }
}
