import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const user = await getCurrentUser()
    return apiSuccess(user)
  } catch (error) {
    return handleError(error)
  }
} 