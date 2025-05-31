import { NextRequest } from 'next/server'
import { getUserProfile, updateUserProfile } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { validateUpdateUserProfile } from '@/lib/schemas/userSchemas'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const profile = await getUserProfile()
    
    if (!profile) {
      return notFoundError(ERROR_MESSAGES.USER_NOT_FOUND, 'User profile not found')
    }
    
    return apiSuccess(profile)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const body = await request.json()
    const validatedData = validateUpdateUserProfile(body)
    
    const success = await updateUserProfile(validatedData)
    
    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      updateError.name = 'DatabaseError'
      throw updateError
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 