import { NextRequest } from 'next/server'
import { isEmailVerified } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const isVerified = await isEmailVerified()
    return apiSuccess({ isVerified })
  } catch (error) {
    return handleError(error)
  }
} 