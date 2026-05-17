'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdminAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { uploadProfesorImage, deleteProfesorImage } from '@/lib/imageUtils.server'
import { getProfesorById, updateProfesor } from '@/lib/profesorUtils'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

type UploadResult =
  | { ok: true; data: { filePath: string; publicUrl: string; replacedExisting: boolean } }
  | ActionError

export async function uploadProfesorImageAction(profesorId: number, formData: FormData): Promise<UploadResult> {
  try {
    await requireAdminAction()
    const existing = await getProfesorById(profesorId)
    if (!existing) return { ok: false, error: 'Profesor not found', code: 'NOT_FOUND' }

    const file = formData.get('image')
    if (!(file instanceof File)) return { ok: false, error: 'No image file provided', code: 'VALIDATION' }
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File must be less than 5MB', code: 'PAYLOAD_TOO_LARGE' }
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: 'Invalid file type', code: 'VALIDATION' }

    if (existing.foto) {
      try { await deleteProfesorImage(existing.foto) } catch (e) { console.warn('Failed deleting old profesor image', e) }
    }

    const buffer = await file.arrayBuffer()
    const { filePath } = await uploadProfesorImage(profesorId, buffer, file.name)
    const { data: { publicUrl } } = serviceClient.storage.from('images').getPublicUrl(filePath)
    await updateProfesor(profesorId, { foto: filePath })

    return { ok: true, data: { filePath, publicUrl, replacedExisting: !!existing.foto } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
