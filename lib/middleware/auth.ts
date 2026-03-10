import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { User } from '@supabase/supabase-js'

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthenticatedUser extends User {
  permissions?: {
    canEditProfile: boolean
    canViewAdmin: boolean
    canManageUsers: boolean
    canManageContent: boolean
    isAdmin: boolean
  }
}

/**
 * Extracts the JWT token from the Authorization header
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    return null
  }

  // Check for "Bearer " prefix
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7) // Remove "Bearer " prefix
}

/**
 * Checks if a user has the alumno role
 */
export async function isAlumno(userId: string): Promise<boolean> {
  const { data } = await serverSupabase
    .from('alumnos')
    .select('auth_id')
    .eq('auth_id', userId)
    .single()
  return !!data
}

/**
 * Gets user permissions by checking the admins table
 */
async function getUserPermissions(userId: string): Promise<AuthenticatedUser['permissions']> {
  // Check if user is admin
  const { data: admin } = await serverSupabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', userId)
    .single()

  const isAdmin = !!admin

  return {
    canEditProfile: true, // All authenticated users can edit their profile
    canViewAdmin: isAdmin,
    canManageUsers: isAdmin,
    canManageContent: isAdmin,
    isAdmin
  }
}

/**
 * Gets the current authenticated user from the request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = extractToken(request)
    
    if (!token) {
      return null
    }

    // Validate the JWT token using Supabase
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Token validation error:', error)
      return null
    }

    // Get user permissions
    const permissions = await getUserPermissions(user.id)

    return {
      ...user,
      permissions
    } as AuthenticatedUser
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Checks if the user has a specific permission
 */
export async function hasPermission(permission: keyof NonNullable<AuthenticatedUser['permissions']>, userId?: string): Promise<boolean> {
  if (!userId) {
    // If no userId provided, we can't check permissions
    return false
  }

  const permissions = await getUserPermissions(userId)
  return permissions[permission]
}

/**
 * Custom error classes for authentication
 */
export class UnauthorizedError extends Error {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new UnauthorizedError()
  }

  return user
}

/**
 * Middleware to require admin permissions
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const isAdmin = await hasPermission('isAdmin', user.id)
  
  if (!isAdmin) {
    throw new ForbiddenError('Admin access required')
  }

  return user
}

/**
 * Middleware to require specific permission
 */
export async function requirePermission(
  request: NextRequest, 
  permission: keyof AuthenticatedUser['permissions']
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const hasRequiredPermission = await hasPermission(permission, user.id)
  
  if (!hasRequiredPermission) {
    throw new ForbiddenError(`Permission ${permission} required`)
  }

  return user
}

/**
 * Middleware to require admin or content management permissions
 */
export async function requireContentManager(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const canManageContent = await hasPermission('canManageContent', user.id)
  const isAdmin = await hasPermission('isAdmin', user.id)
  
  if (!canManageContent && !isAdmin) {
    throw new ForbiddenError('Content management permission required')
  }

  return user
}

/**
 * Middleware to require admin or user management permissions
 */
export async function requireUserManager(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const canManageUsers = await hasPermission('canManageUsers', user.id)
  const isAdmin = await hasPermission('isAdmin', user.id)
  
  if (!canManageUsers && !isAdmin) {
    throw new ForbiddenError('User management permission required')
  }

  return user
}

/**
 * Middleware to require alumno or admin role
 */
export async function requireAlumnoOrAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)

  const alumno = await isAlumno(user.id)
  const admin = await hasPermission('isAdmin', user.id)

  if (!alumno && !admin) {
    throw new ForbiddenError('Acceso restringido a alumnos de la escuela')
  }

  return user
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export async function optionalAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    return await getAuthenticatedUser(request)
  } catch (error) {
    return null
  }
}

/**
 * Checks if the authenticated user is the owner of a resource
 */
export async function requireOwnership(
  request: NextRequest,
  resourceUserId: string | number
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  // Convert to string for comparison
  const userIdStr = String(user.id)
  const resourceUserIdStr = String(resourceUserId)
  
  if (userIdStr !== resourceUserIdStr) {
    // Check if user is admin (admins can access any resource)
    const isAdmin = await hasPermission('isAdmin', user.id)
    if (!isAdmin) {
      throw new ForbiddenError('You can only access your own resources')
    }
  }

  return user
}

/**
 * Validates that the user ID from the URL matches the authenticated user
 */
export async function requireSelfOrAdmin(
  request: NextRequest,
  urlUserId?: string | number
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  // If no URL user ID provided, it means it's a /me endpoint
  if (!urlUserId) {
    return user
  }
  
  return await requireOwnership(request, urlUserId)
}

/**
 * Higher-order function to wrap route handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth(request)
      return await handler(request, user, ...args)
    } catch (error) {
      if (error instanceof Error && error.name === 'UnauthorizedError') {
        return unauthorizedError(error.message)
      }
      if (error instanceof Error && error.name === 'ForbiddenError') {
        return forbiddenError(error.message)
      }
      throw error
    }
  }
}

/**
 * Higher-order function to wrap route handlers with admin authentication
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAdmin(request)
      return await handler(request, user, ...args)
    } catch (error) {
      if (error instanceof Error && error.name === 'UnauthorizedError') {
        return unauthorizedError(error.message)
      }
      if (error instanceof Error && error.name === 'ForbiddenError') {
        return forbiddenError(error.message)
      }
      throw error
    }
  }
} 