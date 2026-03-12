import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, isAlumno } from '@/lib/middleware/auth'
import { hasPermission } from '@/lib/middleware/auth'
import { apiSuccess, handleError, notFoundError, forbiddenError, unauthorizedError } from '@/lib/utils/apiResponse'
import { getDocumentUrl } from '@/lib/documentosUtils'

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

    const supabase = createAdminClient()

    const { data: documento, error } = await supabase
      .from('documentos')
      .select('id, category, file_path')
      .eq('id', docId)
      .single()

    if (error || !documento) {
      return notFoundError('Documento no encontrado')
    }

    // Non-escuela documents: return public URL
    if (documento.category !== 'escuela') {
      const publicUrl = getDocumentUrl(documento.file_path)
      return apiSuccess({ url: publicUrl })
    }

    // Escuela documents: require auth + alumno/admin role
    let user
    try {
      user = await requireAuth(request)
    } catch {
      return unauthorizedError('Iniciá sesión para acceder a documentos de la escuela')
    }

    const alumno = await isAlumno(user.id)
    const admin = await hasPermission('isAdmin', user.id)

    if (!alumno && !admin) {
      return forbiddenError('Acceso restringido a alumnos de la escuela')
    }

    // Generate signed URL (5 minute expiry)
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
