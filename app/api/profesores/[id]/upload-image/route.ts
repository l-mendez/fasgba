import { NextRequest } from 'next/server'
import { getProfesorById, updateProfesor } from '@/lib/profesorUtils'
import { validateProfesorId } from '@/lib/schemas/profesorSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, payloadTooLargeError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'
import { hasPermission } from '@/lib/middleware/auth'
import { generateFileHashFromBuffer } from '@/lib/imageUtils.server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const isSystemAdmin = await hasPermission('isAdmin', user.id)
    if (!isSystemAdmin) {
      return unauthorizedError('Admin access required to upload profesor images')
    }

    const { id: idParam } = await params
    const id = validateProfesorId(idParam)

    const existingProfesor = await getProfesorById(id)
    if (!existingProfesor) {
      return notFoundError('Profesor not found', `No profesor found with ID ${id}`)
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
    if (existingProfesor.foto) {
      try {
        await supabase.storage.from('images').remove([existingProfesor.foto])
      } catch (error) {
        console.warn('Failed to delete existing profesor image, continuing with upload:', error)
      }
    }

    const fileBuffer = await file.arrayBuffer()
    const fileHash = await generateFileHashFromBuffer(fileBuffer)
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const newFileName = `${fileHash}-${timestamp}-${randomId}.${fileExt}`
    const filePath = `profesores/${id}/${newFileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, new Uint8Array(fileBuffer), {
        contentType: file.type
      })

    if (uploadError) {
      throw new Error('Failed to upload image: ' + uploadError.message)
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    await updateProfesor(id, { foto: filePath })

    return apiSuccess({
      filePath,
      publicUrl: urlData.publicUrl,
      replacedExisting: !!existingProfesor.foto
    })
  } catch (error) {
    return handleError(error)
  }
}
