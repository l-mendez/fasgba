'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuthAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { hasPermission, ForbiddenError } from '@/lib/middleware/auth'
import { uploadClubImage, deleteClubImage } from '@/lib/imageUtils.server'
import { updateClub, getClubById, isUserClubAdmin } from '@/lib/clubUtils'
import { revalidateClubsCache } from '@/lib/cache/clubs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

type UploadResult =
  | { ok: true; data: { filePath: string; publicUrl: string; wasReused: boolean; replacedExisting: boolean } }
  | ActionError

export async function uploadClubImageAction(clubId: number, formData: FormData): Promise<UploadResult> {
  try {
    const user = await requireAuthAction()
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    const isSystemAdmin = await hasPermission('isAdmin', user.id)
    if (!isClubAdmin && !isSystemAdmin) {
      throw new ForbiddenError('You must be an admin of this club or a system admin to upload images')
    }

    const existingClub = await getClubById(clubId)
    if (!existingClub) return { ok: false, error: 'Club not found', code: 'NOT_FOUND' }

    const file = formData.get('image')
    if (!(file instanceof File)) return { ok: false, error: 'No image file provided', code: 'VALIDATION' }
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File must be less than 5MB', code: 'PAYLOAD_TOO_LARGE' }
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: 'Invalid file type', code: 'VALIDATION' }

    if (existingClub.image) {
      try { await deleteClubImage(existingClub.image) } catch (e) { console.warn('Failed deleting old club image', e) }
    }

    const buffer = await file.arrayBuffer()
    const upload = await uploadClubImage(clubId, buffer, file.name)
    const { data: { publicUrl } } = serviceClient.storage.from('images').getPublicUrl(upload.filePath)
    await updateClub(clubId, { image: upload.filePath })
    revalidateClubsCache()

    return { ok: true, data: { filePath: upload.filePath, publicUrl, wasReused: upload.wasReused, replacedExisting: !!existingClub.image } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}

export async function deleteClubImageAction(clubId: number): Promise<{ ok: true; data: { deletedImagePath: string } } | ActionError> {
  try {
    const user = await requireAuthAction()
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    const isSystemAdmin = await hasPermission('isAdmin', user.id)
    if (!isClubAdmin && !isSystemAdmin) {
      throw new ForbiddenError('You must be an admin of this club or a system admin to delete images')
    }

    const existingClub = await getClubById(clubId)
    if (!existingClub) return { ok: false, error: 'Club not found', code: 'NOT_FOUND' }
    if (!existingClub.image) return { ok: false, error: 'Club has no image to delete', code: 'VALIDATION' }

    await deleteClubImage(existingClub.image)
    await updateClub(clubId, { image: null })
    revalidateClubsCache()
    return { ok: true, data: { deletedImagePath: existingClub.image } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
