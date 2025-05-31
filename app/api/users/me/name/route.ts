import { NextRequest } from 'next/server'
import { getUserFullName } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const fullName = await getUserFullName()
    return apiSuccess({ fullName })
  } catch (error) {
    return handleError(error)
  }
} 