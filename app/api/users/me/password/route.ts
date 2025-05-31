import { NextRequest } from 'next/server'
import { updatePassword } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { validateUpdatePassword } from '@/lib/schemas/userSchemas'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const body = await request.json()
    const validatedData = validateUpdatePassword(body)
    
    const success = await updatePassword(validatedData.newPassword)
    
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