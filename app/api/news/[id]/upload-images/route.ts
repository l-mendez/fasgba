import { NextRequest } from 'next/server'
import { uploadImagesWithDeduplication } from '@/lib/imageUtils.server'
import { canUserEditNews } from '@/lib/newsUtils'
import { validateNewsId } from '@/lib/schemas/newsSchemas'
import { apiSuccess, handleError, forbiddenError, payloadTooLargeError } from '@/lib/utils/apiResponse'
import { requireAuth } from '@/lib/middleware/auth'

// Configure runtime for handling file uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for file uploads

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { id: idParam } = await params
    const newsId = validateNewsId(idParam)
    
    // Check if user can edit this news
    const canEdit = await canUserEditNews(newsId, user.id)
    if (!canEdit) {
      return forbiddenError('You do not have permission to edit this news item')
    }

    const formData = await request.formData()
    
    // Extract files and their metadata
    const imagesToUpload: Array<{ buffer: ArrayBuffer; fileName: string; prefix?: string }> = []
    
    for (const [key, value] of formData.entries()) {
      // Check if this is a file entry (server-side compatible)
      if (key.startsWith('file-') && value && typeof value === 'object' && 'arrayBuffer' in value && 'name' in value && 'type' in value && 'size' in value) {
        const file = value as File // Type assertion for TypeScript
        const index = key.split('-')[1]
        const prefix = formData.get(`prefix-${index}`) as string || ''
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return handleError(new Error(`File type must be one of: ${ALLOWED_TYPES.join(', ')}`))
        }

        // Convert File to ArrayBuffer for server-side processing
        const buffer = await file.arrayBuffer()
        imagesToUpload.push({ buffer, fileName: file.name, prefix })
      }
    }
    
    if (imagesToUpload.length === 0) {
      return handleError(new Error('No files provided'))
    }

    // Upload images with deduplication
    const uploadResults = await uploadImagesWithDeduplication(newsId, imagesToUpload)

    return apiSuccess(uploadResults)
  } catch (error) {
    return handleError(error)
  }
} 