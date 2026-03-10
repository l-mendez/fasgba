import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  permisos: string[]
  created_at: string
  updated_at: string
}

export interface UserPermissions {
  canEditProfile: boolean
  canViewAdmin: boolean
  canManageUsers: boolean
  canManageContent: boolean
  isAdmin: boolean
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Gets the user's profile data including additional information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Updates the user's profile information
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating user profile:', error)
    return false
  }

  return true
}

/**
 * Gets the user's permissions based on their role
 */
export async function getUserPermissions(): Promise<UserPermissions> {
  const profile = await getUserProfile()
  if (!profile) {
    return {
      canEditProfile: false,
      canViewAdmin: false,
      canManageUsers: false,
      canManageContent: false,
      isAdmin: false
    }
  }

  const isAdmin = profile.permisos.includes('admin')
  
  return {
    canEditProfile: true, // All authenticated users can edit their profile
    canViewAdmin: isAdmin || profile.permisos.includes('view_admin'),
    canManageUsers: isAdmin || profile.permisos.includes('manage_users'),
    canManageContent: isAdmin || profile.permisos.includes('manage_content'),
    isAdmin
  }
}

/**
 * Checks if the user has a specific permission
 */
export async function hasPermission(permission: keyof UserPermissions): Promise<boolean> {
  const permissions = await getUserPermissions()
  return permissions[permission]
}

/**
 * Gets the user's full name
 */
export async function getUserFullName(): Promise<string> {
  const profile = await getUserProfile()
  if (!profile) return ''
  return `${profile.nombre} ${profile.apellido}`.trim()
}

/**
 * Updates the user's password
 */
export async function updatePassword(newPassword: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Error updating password:', error)
    return false
  }

  return true
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

/**
 * Checks if the user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.email_confirmed_at !== null
}

/**
 * Gets the user's session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Gets the user's avatar URL if they have one
 */
export async function getUserAvatarUrl(): Promise<string | null> {
  const profile = await getUserProfile()
  if (!profile) return null

  const { data } = await createClient()
    .storage
    .from('avatars')
    .getPublicUrl(`${profile.id}/avatar`)

  return data.publicUrl
}

/**
 * Uploads a new avatar for the user
 */
export async function uploadAvatar(file: File): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const { error } = await createClient()
    .storage
    .from('avatars')
    .upload(`${user.id}/avatar`, file, {
      upsert: true
    })

  if (error) {
    console.error('Error uploading avatar:', error)
    return false
  }

  return true
} 