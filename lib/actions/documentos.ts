'use server'

import { requireAdminAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateDocumentosCache } from '@/lib/cache/documentos'
import { MAX_FILE_SIZE, isValidCategory, generateStorageFilename, isAllowedMimeType } from '@/lib/documentosUtils'

type UploadResult =
  | { ok: true; data: { documento: any; message: string } }
  | ActionError

export async function uploadDocumentoAction(formData: FormData): Promise<UploadResult> {
  try {
    const user = await requireAdminAction()
    const file = formData.get('file')
    const name = formData.get('name')
    const category = formData.get('category')

    if (!(file instanceof File)) {
      return { ok: false, error: 'No se proporcionó ningún archivo', code: 'VALIDATION' }
    }

    if (!isAllowedMimeType(file.type)) {
      return { ok: false, error: 'Solo se permiten archivos PDF y Excel (.xls, .xlsx)', code: 'VALIDATION' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { ok: false, error: 'El archivo no puede superar los 10MB', code: 'PAYLOAD_TOO_LARGE' }
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return { ok: false, error: 'El nombre del documento es requerido', code: 'VALIDATION' }
    }

    if (name.length > 255) {
      return { ok: false, error: 'El nombre no puede superar los 255 caracteres', code: 'VALIDATION' }
    }

    if (typeof category !== 'string' || !isValidCategory(category)) {
      return { ok: false, error: 'La categoría no es válida', code: 'VALIDATION' }
    }

    const storageFilename = generateStorageFilename(file.name)
    const filePath = `${category}/${storageFilename}`
    const admin = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('documentos')
      .upload(filePath, buffer, { contentType: file.type, cacheControl: '3600', upsert: false })

    if (uploadError) {
      return { ok: false, error: 'Error al subir el archivo: ' + uploadError.message, code: 'INTERNAL' }
    }

    const { data: maxOrderData } = await admin
      .from('documentos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxOrderData?.sort_order ?? 0) + 1

    const { data: documento, error: dbError } = await admin
      .from('documentos')
      .insert({
        name: name.trim(),
        category,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        uploaded_by_auth_id: user.id,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (dbError) {
      await admin.storage.from('documentos').remove([uploadData.path])
      return { ok: false, error: 'Error al guardar el documento: ' + dbError.message, code: 'INTERNAL' }
    }

    revalidateDocumentosCache()
    return { ok: true, data: { documento, message: 'Documento subido exitosamente' } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
