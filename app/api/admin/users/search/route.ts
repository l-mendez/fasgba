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

    // Search users by email using Supabase Auth Admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      perPage: 20,
    })

    if (error) {
      return handleError(error)
    }

    // Filter by email match (case-insensitive)
    const filtered = users
      .filter((u) => u.email?.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata,
      }))

    return apiSuccess({ users: filtered })
  } catch (error) {
    return handleError(error)
  }
}
