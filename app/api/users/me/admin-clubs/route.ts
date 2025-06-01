import { NextRequest } from 'next/server'
import { getUserAdminClubs } from '@/lib/clubUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)
    
    // Use the auth UUID directly (not numeric conversion)
    const adminClubs = await getUserAdminClubs(user.id)
    return apiSuccess(adminClubs)
  } catch (error) {
    return handleError(error)
  }
} 