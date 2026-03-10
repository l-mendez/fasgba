import { NextRequest } from 'next/server'
import { deleteClubImage } from '@/lib/imageUtils.server'
import { updateClub, getClubById, isUserClubAdmin } from '@/lib/clubUtils'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, handleError, notFoundError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { createClient } from '@supabase/supabase-js'
import { hasPermission } from '@/lib/middleware/auth'

interface RouteParams {
  params: Promise<{
    clubId: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
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

    // Check if user is admin of this club OR a system admin
    const isClubAdmin = await isUserClubAdmin(clubId, user.id)
    const isSystemAdmin = await hasPermission('isAdmin', user.id)
    
    if (!isClubAdmin && !isSystemAdmin) {
      return unauthorizedError('You must be an admin of this club or a system admin to delete images')
    }

    // Check if club has an image to delete
    if (!existingClub.image) {
      return handleError(new Error('Club has no image to delete'))
    }

    // Delete the image from storage
    await deleteClubImage(existingClub.image)

    // Update the club record to remove the image reference
    await updateClub(clubId, { image: null })

    return apiSuccess({
      message: 'Club image deleted successfully',
      deletedImagePath: existingClub.image
    })

  } catch (error) {
    return handleError(error)
  }
} 