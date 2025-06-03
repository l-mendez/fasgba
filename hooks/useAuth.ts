"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserPermissions {
  canEditProfile: boolean
  canViewAdmin: boolean
  canManageUsers: boolean
  canManageContent: boolean
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  permissions: UserPermissions | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isClubAdmin: boolean
  adminClubsCount: number
  error?: string
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClubAdmin, setIsClubAdmin] = useState(false)
  const [adminClubsCount, setAdminClubsCount] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserPermissions(session.user.id)
        fetchClubAdminStatus(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserPermissions(session.user.id)
        fetchClubAdminStatus(session.user.id)
      } else {
        setPermissions(null)
        setIsClubAdmin(false)
        setAdminClubsCount(0)
        setError(undefined)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserPermissions = async (userId: string) => {
    try {
      setError(undefined)
      
      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('auth_id')
        .eq('auth_id', userId)
        .single()

      // Handle case where table might not exist or user is not an admin
      const isAdmin = !adminError && !!adminData

      // If error is not "No rows returned", it might be a table access issue
      if (adminError && adminError.code !== 'PGRST116') {
        console.warn('Admin table access error:', adminError)
        setError(`Database access issue: ${adminError.message}`)
      }

      const userPermissions: UserPermissions = {
        canEditProfile: true,
        canViewAdmin: isAdmin,
        canManageUsers: isAdmin,
        canManageContent: isAdmin,
        isAdmin: isAdmin
      }

      setPermissions(userPermissions)
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Set default permissions on error
      setPermissions({
        canEditProfile: true,
        canViewAdmin: false,
        canManageUsers: false,
        canManageContent: false,
        isAdmin: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClubAdminStatus = async (userId: string) => {
    try {
      const { count, error: clubAdminError } = await supabase
        .from('club_admins')
        .select('*', { count: 'exact', head: true })
        .eq('auth_id', userId)

      if (clubAdminError) {
        console.warn('Club admins table access error:', clubAdminError)
        if (clubAdminError.code !== 'PGRST116') {
          setError(`Club admin table access issue: ${clubAdminError.message}`)
        }
        setIsClubAdmin(false)
        setAdminClubsCount(0)
      } else {
        setAdminClubsCount(count || 0)
        setIsClubAdmin((count || 0) > 0)
      }
    } catch (error) {
      console.error('Error fetching club admin status:', error)
      setIsClubAdmin(false)
      setAdminClubsCount(0)
    }
  }

  return {
    user,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: permissions?.isAdmin ?? false,
    isClubAdmin,
    adminClubsCount,
    error
  }
} 