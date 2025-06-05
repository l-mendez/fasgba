import { NextRequest } from 'next/server'
import { uploadClubImage, deleteClubImage } from '@/lib/imageUtils.server'
import { updateClub, getClubById, isUserClubAdmin } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError, payloadTooLargeError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { clubId: clubIdParam } = await params
    const clubId = validateClubId(clubIdParam)
    
    // Check if club exists
    const existingClub = await getClubById(clubId)
    if (!existingClub) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }

    // Check if user is admin of this club
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    if (!isClubAdmin) {
      return unauthorizedError('You must be an admin of this club to upload images')
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return handleError(new Error('No image file provided'))
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return payloadTooLargeError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return handleError(new Error(`File type must be one of: ${ALLOWED_TYPES.join(', ')}`))
    }

    // Delete existing image if present (to prevent orphaned files)
    if (existingClub.image) {
      try {
        await deleteClubImage(existingClub.image)
        console.log(`Deleted existing club image: ${existingClub.image}`)
      } catch (error) {
        console.warn('Failed to delete existing image, continuing with upload:', error)
        // Continue with upload even if deletion fails (image might already be deleted)
      }
    }

    // Convert file to ArrayBuffer for server processing
    const fileBuffer = await file.arrayBuffer()

    // Upload the new image
    const uploadResult = await uploadClubImage(clubId, fileBuffer, file.name)

    // Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(uploadResult.filePath)

    // Update the club with the new image URL
    await updateClub(clubId, { image: uploadResult.filePath })

    return apiSuccess({
      filePath: uploadResult.filePath,
      publicUrl: urlData.publicUrl,
      wasReused: uploadResult.wasReused,
      replacedExisting: !!existingClub.image
    })

  } catch (error) {
    return handleError(error)
  }
} 