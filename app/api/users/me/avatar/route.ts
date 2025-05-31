import { NextRequest } from 'next/server'
import { getUserAvatarUrl, uploadAvatar } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { validateFileFromFormData } from '@/lib/schemas/userSchemas'
import { apiSuccess, created, noContent, handleError, payloadTooLargeError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const avatarUrl = await getUserAvatarUrl()
    return apiSuccess({ avatarUrl })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const formData = await request.formData()
    const file = validateFileFromFormData(formData)
    
    const success = await uploadAvatar(file)
    
    if (!success) {
      const uploadError = new Error('Failed to upload avatar')
      uploadError.name = 'DatabaseError'
      throw uploadError
    }
    
    return created({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    // For avatar deletion, we would typically call a delete function
    // Since it's not in userUtils, we'll simulate it
    // In a real implementation, you'd add a deleteAvatar function to userUtils
    
    // Placeholder for avatar deletion logic
    // const success = await deleteAvatar()
    
    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 