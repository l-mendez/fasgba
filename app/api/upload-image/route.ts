import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, payloadTooLargeError } from '@/lib/utils/apiResponse'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return handleError(new Error('No file provided'))
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return handleError(new Error(`File type must be one of: ${ALLOWED_TYPES.join(', ')}`))
    }

    const supabase = await createClient()
    
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `general/${fileName}`
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return handleError(new Error('Failed to upload image: ' + uploadError.message))
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return apiSuccess({
      filePath,
      publicUrl,
      fileName
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { filePath } = await request.json()
    
    if (!filePath) {
      return handleError(new Error('File path is required'))
    }

    const supabase = await createClient()
    
    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove([filePath])
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return handleError(new Error('Failed to delete image: ' + deleteError.message))
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 