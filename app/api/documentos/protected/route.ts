import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getDocumentoRoles } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'
import { getViewableCategories } from '@/lib/documentosUtils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/documentos/protected
 * Returns every documento the authenticated user may view, according to their
 * roles (see canViewDocumentoCategory). Documents are never shipped to
 * anonymous viewers or embedded in the statically-cached /documentos page.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const categories = getViewableCategories(await getDocumentoRoles(user.id))
    if (categories.length === 0) {
      return forbiddenError('Acceso restringido a delegados y administradores')
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('documentos')
      .select('id, name, category, file_path, file_size, created_at')
      .in('category', categories)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching documentos:', error)
      return apiSuccess({ documentos: [] })
    }

    return apiSuccess({ documentos: data || [] })
  } catch (error) {
    return handleError(error)
  }
}
