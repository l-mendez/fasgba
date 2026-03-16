import { NextRequest } from 'next/server'
import { uploadArbitroImage, deleteArbitroImage } from '@/lib/imageUtils.server'
import { updateArbitro, getArbitroById } from '@/lib/arbitroUtils'
import { validateArbitroId } from '@/lib/schemas/arbitroSchemas'
import { requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError, notFoundError, payloadTooLargeError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

interface RouteParams {
  params: Promise<{
    arbitroId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { arbitroId: arbitroIdParam } = await params
    const arbitroId = validateArbitroId(arbitroIdParam)

    const existingArbitro = await getArbitroById(arbitroId)
    if (!existingArbitro) {
      return notFoundError(ERROR_MESSAGES.ARBITRO_NOT_FOUND, `No arbitro found with ID ${arbitroId}`)
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return handleError(new Error('No image file provided'))
    }

    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return handleError(new Error(`File type must be one of: ${ALLOWED_TYPES.join(', ')}`))
    }

    // Delete existing image if present
    if (existingArbitro.photo) {
      try {
        await deleteArbitroImage(existingArbitro.photo)
      } catch (error) {
        console.warn('Failed to delete existing image, continuing with upload:', error)
      }
    }

    const fileBuffer = await file.arrayBuffer()
    const uploadResult = await uploadArbitroImage(arbitroId, fileBuffer, file.name)

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(uploadResult.filePath)

    await updateArbitro(arbitroId, { photo: uploadResult.filePath })

    return apiSuccess({
      filePath: uploadResult.filePath,
      publicUrl: urlData.publicUrl,
      wasReused: uploadResult.wasReused,
      replacedExisting: !!existingArbitro.photo
    })
  } catch (error) {
    return handleError(error)
  }
}
