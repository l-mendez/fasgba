'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdminAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { uploadArbitroImage, deleteArbitroImage } from '@/lib/imageUtils.server'
import { updateArbitro, getArbitroById } from '@/lib/arbitroUtils'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

type UploadResult =
  | { ok: true; data: { filePath: string; publicUrl: string; wasReused: boolean; replacedExisting: boolean } }
  | ActionError

export async function uploadArbitroImageAction(arbitroId: number, formData: FormData): Promise<UploadResult> {
  try {
    await requireAdminAction()
    const existing = await getArbitroById(arbitroId)
    if (!existing) return { ok: false, error: 'Arbitro not found', code: 'NOT_FOUND' }

    const file = formData.get('image')
    if (!(file instanceof File)) return { ok: false, error: 'No image file provided', code: 'VALIDATION' }
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File must be less than 5MB', code: 'PAYLOAD_TOO_LARGE' }
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: 'Invalid file type', code: 'VALIDATION' }

    if (existing.photo) {
      try { await deleteArbitroImage(existing.photo) } catch (e) { console.warn('Failed deleting old arbitro image', e) }
    }

    const buffer = await file.arrayBuffer()
    const upload = await uploadArbitroImage(arbitroId, buffer, file.name)
    const { data: { publicUrl } } = serviceClient.storage.from('images').getPublicUrl(upload.filePath)
    await updateArbitro(arbitroId, { photo: upload.filePath })

    return { ok: true, data: { filePath: upload.filePath, publicUrl, wasReused: upload.wasReused, replacedExisting: !!existing.photo } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}

export async function deleteArbitroImageAction(arbitroId: number): Promise<{ ok: true; data: { deletedImagePath: string } } | ActionError> {
  try {
    await requireAdminAction()
    const existing = await getArbitroById(arbitroId)
    if (!existing) return { ok: false, error: 'Arbitro not found', code: 'NOT_FOUND' }
    if (!existing.photo) return { ok: false, error: 'Arbitro has no image to delete', code: 'VALIDATION' }

    await deleteArbitroImage(existing.photo)
    await updateArbitro(arbitroId, { photo: null })
    return { ok: true, data: { deletedImagePath: existing.photo } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
