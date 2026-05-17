import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
  return permissions?.[permission] ?? false
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
 * Checks if a user is an admin of any club
 */
export async function isAnyClubAdmin(userId: string): Promise<boolean> {
  const { data } = await serverSupabase
    .from('club_admins')
    .select('club_id')
    .eq('auth_id', userId)
    .limit(1)
  return !!data && data.length > 0
}

/**
 * Returns the club IDs where the user is a club admin
 */
export async function getClubAdminClubIds(userId: string): Promise<number[]> {
  const { data } = await serverSupabase
    .from('club_admins')
    .select('club_id')
    .eq('auth_id', userId)
  return (data || []).map(d => d.club_id)
}

