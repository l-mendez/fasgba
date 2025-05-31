import { NextRequest } from 'next/server'
import { getUserAdminClubs } from '@/lib/clubUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)
    
    // Get user ID from the database profile
    // Note: This would typically come from a user profile lookup
    const userNumericId = parseInt(user.id) || 0 // This is a simplification
    
    const adminClubs = await getUserAdminClubs(userNumericId)
    return apiSuccess(adminClubs)
  } catch (error) {
    return handleError(error)
  }
} 