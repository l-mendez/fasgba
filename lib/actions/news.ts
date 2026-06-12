'use server'

import { revalidatePath, updateTag } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { requireAuthAction, mapErrorToResult, type ActionError } from '@/lib/actions/auth'
import { ForbiddenError } from '@/lib/middleware/auth'
import { canUserEditNews, getNewsById, updateNews, deleteNews } from '@/lib/newsUtils'
import { validateUpdateNews } from '@/lib/schemas/newsSchemas'
import { uploadImagesWithDeduplication } from '@/lib/imageUtils.server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

type UploadResult =
  | { ok: true; data: { filePath: string; publicUrl: string } }
  | ActionError
type BatchUploadResult =
  | { ok: true; data: { results: Array<{ filePath: string; publicUrl: string; wasReused: boolean; originalIndex: number }> } }
  | ActionError
type DeleteResult = { ok: true } | ActionError

function revalidateNewsPages(newsId: number) {
  updateTag('news')
  revalidatePath('/')
  revalidatePath('/noticias')
  revalidatePath(`/noticias/${newsId}`)
}

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

export async function updateNewsAction(newsId: number, input: unknown): Promise<{ ok: true } | ActionError> {
  try {
    const user = await requireAuthAction()
    const existing = await getNewsById(newsId, [])
    if (!existing) return { ok: false, error: 'News not found', code: 'NOT_FOUND' }
    if (!(await canUserEditNews(newsId, user.id))) throw new ForbiddenError('You do not have permission to edit this news item')

    const validated = validateUpdateNews(input)
    await updateNews(newsId, validated)
    revalidateNewsPages(newsId)
    return { ok: true }
  } catch (err) {
    return mapErrorToResult(err)
  }
}

export async function uploadNewsImagesAction(newsId: number, formData: FormData): Promise<BatchUploadResult> {
  try {
    const user = await requireAuthAction()
    if (!(await canUserEditNews(newsId, user.id))) throw new ForbiddenError('You do not have permission to edit this news item')

    const imagesToUpload: Array<{ buffer: ArrayBuffer; fileName: string; prefix?: string }> = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        const file = value
        const index = key.split('-')[1]
        const prefix = (formData.get(`prefix-${index}`) as string) || ''

        if (file.size > MAX_FILE_SIZE) {
          return { ok: false, error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`, code: 'PAYLOAD_TOO_LARGE' }
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          return { ok: false, error: `File type must be one of: ${ALLOWED_TYPES.join(', ')}`, code: 'VALIDATION' }
        }

        const buffer = await file.arrayBuffer()
        imagesToUpload.push({ buffer, fileName: file.name, prefix })
      }
    }

    if (imagesToUpload.length === 0) {
      return { ok: false, error: 'No files provided', code: 'VALIDATION' }
    }

    const uploadResults = await uploadImagesWithDeduplication(newsId, imagesToUpload)
    const supabase = await createClient()
    const results = uploadResults.map((r) => ({
      filePath: r.filePath,
      publicUrl: supabase.storage.from('images').getPublicUrl(r.filePath).data.publicUrl,
      wasReused: r.wasReused,
      originalIndex: r.originalIndex,
    }))

    return { ok: true, data: { results } }
  } catch (err) {
    return mapErrorToResult(err)
  }
}

export async function deleteNewsAction(newsId: number): Promise<{ ok: true } | ActionError> {
  try {
    const user = await requireAuthAction()
    const existing = await getNewsById(newsId, [])
    if (!existing) return { ok: false, error: 'News not found', code: 'NOT_FOUND' }
    if (!(await canUserEditNews(newsId, user.id))) throw new ForbiddenError('You do not have permission to delete this news item')

    await deleteNews(newsId)
    revalidateNewsPages(newsId)
    return { ok: true }
  } catch (err) {
    return mapErrorToResult(err)
  }
}
