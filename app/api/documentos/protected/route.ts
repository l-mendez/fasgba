import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, isAlumno, isAnyClubAdmin, hasPermission } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError, validationError } from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

// Escuela docs: alumnos and site admins. Mirrors the previous server-side gating.
async function canAccessEscuela(userId: string): Promise<boolean> {
  if (await isAlumno(userId)) return true
  return hasPermission('isAdmin', userId)
}

// Otros docs: site admins and any club admin.
async function canAccessOtros(userId: string): Promise<boolean> {
  if (await hasPermission('isAdmin', userId)) return true
  return isAnyClubAdmin(userId)
}

/**
 * GET /api/documentos/protected?category=escuela|otros
 * Returns documents in a protected category, but only to authenticated users
 * who pass that category's access check. This keeps protected document metadata
 * out of the statically-cached /documentos page entirely.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const category = new URL(request.url).searchParams.get('category')
    if (category !== 'escuela' && category !== 'otros') {
      return validationError('Invalid category')
    }

    const allowed = category === 'escuela'
      ? await canAccessEscuela(user.id)
      : await canAccessOtros(user.id)

    if (!allowed) {
      return forbiddenError()
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('documentos')
      .select('id, name, category, file_path, file_size, created_at')
      .eq('category', category)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching protected documentos:', error)
      return apiSuccess({ documentos: [] })
    }

    return apiSuccess({ documentos: data || [] })
  } catch (error) {
    return handleError(error)
  }
}
