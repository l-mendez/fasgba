import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiSuccess,
  handleError,
  notFoundError,
  validationError,
} from '@/lib/utils/apiResponse'
import { documentoIdSchema } from '@/lib/schemas/documentosSchemas'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/documentos/[id]
 * Admin endpoint to get a single document with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const idResult = documentoIdSchema.safeParse(id)

    if (!idResult.success) {
      return validationError('ID de documento no válido')
    }

    const adminSupabase = createAdminClient()

    const { data: documento, error } = await adminSupabase
      .from('documentos')
      .select('*')
      .eq('id', idResult.data)
      .single()

    if (error || !documento) {
      return notFoundError('Documento no encontrado')
    }

    return apiSuccess({ documento })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/admin/documentos/[id]
 * Admin endpoint to delete a document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const idResult = documentoIdSchema.safeParse(id)

    if (!idResult.success) {
      return validationError('ID de documento no válido')
    }

    const adminSupabase = createAdminClient()

    // First, get the document to find the file path
    const { data: documento, error: fetchError } = await adminSupabase
      .from('documentos')
      .select('id, file_path, name')
      .eq('id', idResult.data)
      .single()

    if (fetchError || !documento) {
      return notFoundError('Documento no encontrado')
    }

    // Delete the file from storage
    if (documento.file_path) {
      const { error: storageError } = await adminSupabase.storage
        .from('documentos')
        .remove([documento.file_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete the record from database
    const { error: deleteError } = await adminSupabase
      .from('documentos')
      .delete()
      .eq('id', idResult.data)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return validationError('Error al eliminar el documento: ' + deleteError.message)
    }

    return apiSuccess({
      success: true,
      message: `Documento "${documento.name}" eliminado exitosamente`,
    })
  } catch (error) {
    return handleError(error)
  }
}
