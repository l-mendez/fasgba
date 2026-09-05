import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getDocumentoRoles } from '@/lib/middleware/auth'
import { apiSuccess, handleError, notFoundError, forbiddenError, unauthorizedError } from '@/lib/utils/apiResponse'
import { canViewDocumentoCategory, type DocumentCategory } from '@/lib/documentosUtils'

/**
 * GET /api/documentos/download/[id]
 * Returns a short-lived signed URL. Every category is restricted: escuela to
 * alumnos/admins, the rest to admins and club admins (delegados).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const docId = parseInt(id, 10)

    if (isNaN(docId) || docId <= 0) {
      return notFoundError('Documento no encontrado')
    }

    let user
    try {
      user = await requireAuth(request)
    } catch {
      return unauthorizedError('Iniciá sesión para acceder a este documento')
    }

    const supabase = createAdminClient()

    const { data: documento, error } = await supabase
      .from('documentos')
      .select('id, category, file_path')
      .eq('id', docId)
      .single()

    if (error || !documento) {
      return notFoundError('Documento no encontrado')
    }

    const roles = await getDocumentoRoles(user.id)
    if (!canViewDocumentoCategory(documento.category as DocumentCategory, roles)) {
      return forbiddenError(
        documento.category === 'escuela'
          ? 'Acceso restringido a alumnos de la escuela'
          : 'Acceso restringido a delegados y administradores'
      )
    }

    // Signed URL (5 minute expiry)
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(documento.file_path, 300)

    if (signedError || !signedData?.signedUrl) {
      return handleError(signedError || new Error('Error generando URL'))
    }

    return apiSuccess({ url: signedData.signedUrl })
  } catch (error) {
    return handleError(error)
  }
}
