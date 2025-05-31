import { NextRequest } from 'next/server'
import { getUserPermissions } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const permissions = await getUserPermissions()
    return apiSuccess(permissions)
  } catch (error) {
    return handleError(error)
  }
} 