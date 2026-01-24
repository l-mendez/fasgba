import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiSuccess,
  handleError,
  validationError,
  payloadTooLargeError,
} from '@/lib/utils/apiResponse'
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPE,
  isValidCategory,
  generateStorageFilename,
} from '@/lib/documentosUtils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/documentos/upload
 * Admin endpoint to upload a document
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const category = formData.get('category') as string | null

    // Validate file
    if (!file) {
      return validationError('No se proporcionó ningún archivo')
    }

    // Validate file type
    if (file.type !== ALLOWED_MIME_TYPE) {
      return validationError('Solo se permiten archivos PDF')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError('El archivo no puede superar los 10MB')
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return validationError('El nombre del documento es requerido')
    }

    if (name.length > 255) {
      return validationError('El nombre no puede superar los 255 caracteres')
    }

    // Validate category
    if (!category || !isValidCategory(category)) {
      return validationError('La categoría no es válida')
    }

    // Generate unique filename for storage
    const storageFilename = generateStorageFilename(file.name)
    const filePath = `${category}/${storageFilename}`

    // Get admin client for storage operations
    const adminSupabase = createAdminClient()

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('documentos')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return validationError('Error al subir el archivo: ' + uploadError.message)
    }

    // Insert record into documentos table
    const { data: documento, error: dbError } = await adminSupabase
      .from('documentos')
      .insert({
        name: name.trim(),
        category,
        file_path: uploadData.path,
        file_size: file.size,
        uploaded_by_auth_id: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up uploaded file
      await adminSupabase.storage.from('documentos').remove([uploadData.path])
      return validationError('Error al guardar el documento: ' + dbError.message)
    }

    return apiSuccess({
      success: true,
      documento,
      message: 'Documento subido exitosamente',
    })
  } catch (error) {
    return handleError(error)
  }
}
