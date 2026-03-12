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
  isAlumno: boolean
  adminClubsCount: number
  error?: string
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClubAdmin, setIsClubAdmin] = useState(false)
  const [isAlumno, setIsAlumno] = useState(false)
  const [adminClubsCount, setAdminClubsCount] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPermissionsFromAPI(session.access_token)
      } else {
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPermissionsFromAPI(session.access_token)
      } else {
        setPermissions(null)
        setIsClubAdmin(false)
        setIsAlumno(false)
        setAdminClubsCount(0)
        setError(undefined)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchPermissionsFromAPI = async (token: string) => {
    try {
      setError(undefined)

      const res = await fetch('/api/users/me/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Error al obtener permisos')
      }

      const { data } = await res.json()

      setPermissions({
        canEditProfile: data.canEditProfile,
        canViewAdmin: data.canViewAdmin,
        canManageUsers: data.canManageUsers,
        canManageContent: data.canManageContent,
        isAdmin: data.isAdmin,
      })
      setIsClubAdmin(data.isClubAdmin)
      setIsAlumno(data.isAlumno)
      setAdminClubsCount(data.adminClubsCount)
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPermissions({
        canEditProfile: true,
        canViewAdmin: false,
        canManageUsers: false,
        canManageContent: false,
        isAdmin: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: permissions?.isAdmin ?? false,
    isClubAdmin,
    isAlumno,
    adminClubsCount,
    error
  }
}
