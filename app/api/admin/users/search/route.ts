import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()?.toLowerCase()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '15', 10)))

    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []

    if (query && query.length < 3) {
      return validationError('La búsqueda debe tener al menos 3 caracteres')
    }

    const supabase = createAdminClient()

    // Fetch all auth users (up to 1000)
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (authError) {
      return handleError(authError)
    }

    // Fetch public.users for club info (safe separate query)
    let clubMap: Record<string, string> = {}
    try {
      const { data: publicUsers } = await supabase
        .from('users')
        .select('auth_id, club_id')
        .not('auth_id', 'is', null)
        .not('club_id', 'is', null)

      if (publicUsers && publicUsers.length > 0) {
        const clubIds = [...new Set(publicUsers.map(u => u.club_id).filter(Boolean))]
        if (clubIds.length > 0) {
          const { data: clubs } = await supabase
            .from('clubs')
            .select('id, name')
            .in('id', clubIds)

          const clubNameMap: Record<number, string> = {}
          clubs?.forEach(c => { clubNameMap[c.id] = c.name })
          publicUsers.forEach(u => {
            if (u.auth_id && u.club_id && clubNameMap[u.club_id]) {
              clubMap[u.auth_id] = clubNameMap[u.club_id]
            }
          })
        }
      }
    } catch {
      // Club info is optional, don't fail the whole request
    }

    // Sort by creation date (newest first), exclude specified IDs
    const excludeSet = new Set(excludeIds)
    let filtered = [...(authUsers || [])]
      .filter((u) => !excludeSet.has(u.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply search filter
    if (query) {
      filtered = filtered.filter((u) => {
        const nombre = (u.user_metadata?.nombre || '').toLowerCase()
        const apellido = (u.user_metadata?.apellido || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        const club = clubMap[u.id]?.toLowerCase() || ''
        return nombre.includes(query) || apellido.includes(query) || email.includes(query) || club.includes(query)
      })
    }

    const total = filtered.length
    const paged = filtered.slice((page - 1) * perPage, page * perPage)

    const mapped = paged.map((u) => ({
      id: u.id,
      email: u.email,
      user_metadata: { nombre: u.user_metadata?.nombre || '', apellido: u.user_metadata?.apellido || '' },
      club_name: clubMap[u.id] || null,
    }))

    return apiSuccess({ users: mapped, total, page, perPage })
  } catch (error) {
    return handleError(error)
  }
}
