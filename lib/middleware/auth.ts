import { NextRequest } from 'next/server'
import { getCurrentUser, getUserPermissions, hasPermission } from '@/lib/userUtils'
import { unauthorizedError, forbiddenError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'
import { User } from '@supabase/supabase-js'

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
 * Gets the current authenticated user from the request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = extractToken(request)
    
    if (!token) {
      return null
    }

    // Use the existing userUtils function to get the current user
    const user = await getCurrentUser()
    
    if (!user) {
      return null
    }

    // Get user permissions
    const permissions = await getUserPermissions()

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
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error('UnauthorizedError')
  }

  return user
}

/**
 * Middleware to require admin permissions
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const isAdmin = await hasPermission('isAdmin')
  
  if (!isAdmin) {
    throw new Error('ForbiddenError')
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
  
  const hasRequiredPermission = await hasPermission(permission)
  
  if (!hasRequiredPermission) {
    throw new Error('ForbiddenError')
  }

  return user
}

/**
 * Middleware to require admin or content management permissions
 */
export async function requireContentManager(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const canManageContent = await hasPermission('canManageContent')
  const isAdmin = await hasPermission('isAdmin')
  
  if (!canManageContent && !isAdmin) {
    throw new Error('ForbiddenError')
  }

  return user
}

/**
 * Middleware to require admin or user management permissions
 */
export async function requireUserManager(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  const canManageUsers = await hasPermission('canManageUsers')
  const isAdmin = await hasPermission('isAdmin')
  
  if (!canManageUsers && !isAdmin) {
    throw new Error('ForbiddenError')
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
    const isAdmin = await hasPermission('isAdmin')
    if (!isAdmin) {
      throw new Error('ForbiddenError')
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