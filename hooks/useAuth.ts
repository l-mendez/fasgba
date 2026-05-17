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

interface PermissionsResponse extends UserPermissions {
  isClubAdmin: boolean
  isAlumno: boolean
  adminClubsCount: number
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

// Module-level dedupe: if multiple components mount simultaneously (e.g.
// ClientSiteHeader + AdminLayout), they share a single in-flight request
// instead of each firing their own.
let pendingPermissions: { token: string; promise: Promise<PermissionsResponse> } | null = null

async function fetchPermissions(token: string): Promise<PermissionsResponse> {
  if (pendingPermissions && pendingPermissions.token === token) {
    return pendingPermissions.promise
  }
  const promise = (async () => {
    const res = await fetch('/api/users/me/permissions', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Error al obtener permisos')
    return res.json() as Promise<PermissionsResponse>
  })().finally(() => {
    if (pendingPermissions?.token === token) pendingPermissions = null
  })
  pendingPermissions = { token, promise }
  return promise
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClubAdmin, setIsClubAdmin] = useState(false)
  const [isAlumno, setIsAlumno] = useState(false)
  const [adminClubsCount, setAdminClubsCount] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const loadPermissions = async (token: string) => {
      try {
        setError(undefined)
        const data = await fetchPermissions(token)
        if (cancelled) return
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
        if (cancelled) return
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
        if (!cancelled) setIsLoading(false)
      }
    }

    const clearAuthState = () => {
      setPermissions(null)
      setIsClubAdmin(false)
      setIsAlumno(false)
      setAdminClubsCount(0)
      setError(undefined)
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        loadPermissions(session.access_token)
      } else {
        setIsLoading(false)
      }
    })

    // Only react to explicit sign-in/out. TOKEN_REFRESHED and INITIAL_SESSION
    // fire on every authenticated request through the SSR middleware (which
    // rotates the auth cookie via getUser()); refetching here closes a feedback
    // loop that hammers /api/users/me/permissions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        loadPermissions(session.access_token)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        clearAuthState()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

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
