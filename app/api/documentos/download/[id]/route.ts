import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, getDocumentoRoles } from '@/lib/middleware/auth'
import { apiSuccess, handleError, notFoundError, forbiddenError, unauthorizedError } from '@/lib/utils/apiResponse'
import { canViewDocumentoCategory, getDocumentoExtension, type DocumentCategory } from '@/lib/documentosUtils'

/**
 * GET /api/documentos/download/[id]?download=1
 * Returns a short-lived signed URL for the document. Every category is
 * restricted (see canViewDocumentoCategory). With `download=1` the URL carries
 * a Content-Disposition attachment so browsers save the file instead of
 * navigating to it (the anchor `download` attribute is ignored cross-origin).
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

    const [{ data: documento, error }, roles] = await Promise.all([
      supabase.from('documentos').select('id, name, category, file_path').eq('id', docId).single(),
      getDocumentoRoles(user),
    ])

    if (error || !documento) {
      return notFoundError('Documento no encontrado')
    }

    if (!canViewDocumentoCategory(documento.category as DocumentCategory, roles)) {
      return forbiddenError('No tenés acceso a este documento')
    }

    const asDownload = new URL(request.url).searchParams.get('download') === '1'

    // Signed URL (5 minute expiry)
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(documento.file_path, 300, {
        download: asDownload ? `${documento.name}.${getDocumentoExtension(documento.file_path)}` : false,
      })

    if (signedError || !signedData?.signedUrl) {
      return handleError(signedError || new Error('Error generando URL'))
    }

    return apiSuccess({ url: signedData.signedUrl })
  } catch (error) {
    return handleError(error)
  }
}
