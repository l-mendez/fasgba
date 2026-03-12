import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { validatePermissionParam } from '@/lib/schemas/userSchemas'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    permission: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    const { permission: permissionParam } = await params
    const permission = validatePermissionParam(permissionParam)
    
    // Check if user is admin
    const { data: admin } = await (await createClient())
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    const isAdmin = !!admin
    
    let hasPermission = false
    
    switch (permission) {
      case 'canEditProfile':
        hasPermission = true // All authenticated users can edit their profile
        break
      case 'canViewAdmin':
      case 'canManageUsers':
      case 'canManageContent':
        hasPermission = isAdmin
        break
      default:
        return forbiddenError('Unknown permission')
    }
    
    return apiSuccess({ hasPermission })
  } catch (error) {
    return handleError(error)
  }
} 