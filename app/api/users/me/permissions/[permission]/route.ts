import { NextRequest } from 'next/server'
import { hasPermission } from '@/lib/userUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { validatePermissionParam } from '@/lib/schemas/userSchemas'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

interface RouteParams {
  params: {
    permission: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    await requireAuth(request)
    
    const permission = validatePermissionParam(params.permission)
    const hasRequiredPermission = await hasPermission(permission)
    
    return apiSuccess({ hasPermission: hasRequiredPermission })
  } catch (error) {
    return handleError(error)
  }
} 