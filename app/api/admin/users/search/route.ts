import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 3) {
      return validationError('La búsqueda debe tener al menos 3 caracteres')
    }

    const supabase = createAdminClient()

    // Search public.users table by name, surname, or email
    const pattern = `%${query}%`
    const { data: users, error } = await supabase
      .from('users')
      .select('auth_id, name, surname, email, club:clubs!users_club_id_fkey(name)')
      .or(`name.ilike.${pattern},surname.ilike.${pattern},email.ilike.${pattern}`)
      .not('auth_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15)

    if (error) {
      return handleError(error)
    }

    const filtered = (users || []).map((u) => ({
      id: u.auth_id,
      email: u.email,
      user_metadata: { nombre: u.name, apellido: u.surname },
      club_name: (u.club as any)?.name || null,
    }))

    return apiSuccess({ users: filtered })
  } catch (error) {
    return handleError(error)
  }
}
