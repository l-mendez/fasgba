import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '15', 10)))

    // When searching, require at least 3 chars
    if (query && query.length < 3) {
      return validationError('La búsqueda debe tener al menos 3 caracteres')
    }

    const supabase = createAdminClient()

    const offset = (page - 1) * perPage
    let dbQuery = supabase
      .from('users')
      .select('auth_id, name, surname, email, club_id', { count: 'exact' })
      .not('auth_id', 'is', null)
      .order('created_at', { ascending: false })

    if (query) {
      const pattern = `%${query}%`
      dbQuery = dbQuery.or(`name.ilike.${pattern},surname.ilike.${pattern},email.ilike.${pattern}`)
    }

    const { data: users, error, count } = await dbQuery.range(offset, offset + perPage - 1)

    if (error) {
      return handleError(error)
    }

    // Fetch club names for users that have a club_id
    const clubIds = [...new Set((users || []).map(u => u.club_id).filter(Boolean))]
    let clubMap: Record<number, string> = {}
    if (clubIds.length > 0) {
      const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name')
        .in('id', clubIds)
      clubs?.forEach(c => { clubMap[c.id] = c.name })
    }

    const mapped = (users || []).map((u) => ({
      id: u.auth_id,
      email: u.email,
      user_metadata: { nombre: u.name, apellido: u.surname },
      club_name: u.club_id ? clubMap[u.club_id] || null : null,
    }))

    return apiSuccess({ users: mapped, total: count || 0, page, perPage })
  } catch (error) {
    return handleError(error)
  }
}
