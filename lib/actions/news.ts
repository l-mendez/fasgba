'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuthAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { ForbiddenError } from '@/lib/middleware/auth'
import { canUserEditNews } from '@/lib/newsUtils'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

type UploadResult =
  | { ok: true; data: { filePath: string; publicUrl: string } }
  | ActionError
type DeleteResult = { ok: true } | ActionError

export async function uploadNewsImageAction(newsId: number, formData: FormData): Promise<UploadResult> {
  try {
    const user = await requireAuthAction()
    if (!(await canUserEditNews(newsId, user.id))) throw new ForbiddenError('Not allowed to edit this news item')

    const file = formData.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'No file provided', code: 'VALIDATION' }
    if (file.size > MAX_FILE_SIZE) return { ok: false, error: 'File must be less than 5MB', code: 'PAYLOAD_TOO_LARGE' }
    if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: 'Invalid file type', code: 'VALIDATION' }

    const supabase = await createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `news/blocks/${fileName}`

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file)
    if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message)

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath)
    return { ok: true, data: { filePath, publicUrl } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}

export async function deleteNewsImageAction(newsId: number, filePath: string): Promise<DeleteResult> {
  try {
    const user = await requireAuthAction()
    if (!(await canUserEditNews(newsId, user.id))) throw new ForbiddenError('Not allowed to edit this news item')
    if (!filePath) return { ok: false, error: 'File path is required', code: 'VALIDATION' }

    const supabase = await createClient()
    const { error } = await supabase.storage.from('images').remove([filePath])
    if (error) throw new Error('Failed to delete image: ' + error.message)
    return { ok: true }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
