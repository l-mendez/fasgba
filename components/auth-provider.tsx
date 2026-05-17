"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

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

export interface AuthState {
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

const AuthContext = createContext<AuthState | null>(null)

const CACHE_KEY = 'fasgba:auth-snapshot:v1'
const CACHE_TTL_MS = 30 * 60 * 1000

interface CachedSnapshot {
  userId: string
  data: PermissionsResponse
  timestamp: number
}

function readSnapshotCache(userId: string): PermissionsResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedSnapshot
    if (cached.userId !== userId) return null
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null
    return cached.data
  } catch {
    return null
  }
}

function writeSnapshotCache(userId: string, data: PermissionsResponse): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CachedSnapshot = { userId, data, timestamp: Date.now() }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage may be unavailable or full; fall back to refetching next mount.
  }
}

function clearSnapshotCache(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    // ignore
  }
}

async function fetchPermissions(token: string): Promise<PermissionsResponse> {
  const res = await fetch('/api/users/me/permissions', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Error al obtener permisos')
  return res.json() as Promise<PermissionsResponse>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClubAdmin, setIsClubAdmin] = useState(false)
  const [isAlumno, setIsAlumno] = useState(false)
  const [adminClubsCount, setAdminClubsCount] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)
  const loadedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const applySnapshot = (data: PermissionsResponse) => {
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
    }

    const loadPermissions = async (token: string, userId: string) => {
      try {
        setError(undefined)
        const data = await fetchPermissions(token)
        if (cancelled) return
        applySnapshot(data)
        writeSnapshotCache(userId, data)
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

    const hydrateForUser = (session: { user: User; access_token: string }) => {
      if (loadedUserIdRef.current === session.user.id) return
      loadedUserIdRef.current = session.user.id
      setUser(session.user)
      const cached = readSnapshotCache(session.user.id)
      if (cached) {
        applySnapshot(cached)
        setIsLoading(false)
        return
      }
      loadPermissions(session.access_token, session.user.id)
    }

    const clearAuthState = () => {
      loadedUserIdRef.current = null
      clearSnapshotCache()
      setPermissions(null)
      setIsClubAdmin(false)
      setIsAlumno(false)
      setAdminClubsCount(0)
      setError(undefined)
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        hydrateForUser({ user: session.user, access_token: session.access_token })
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    // Only react to user-identity changes. TOKEN_REFRESHED, INITIAL_SESSION,
    // and SIGNED_IN can all fire when the SSR middleware rotates the auth
    // cookie (via getUser()) — refetching for the same user closes a feedback
    // loop that hammers /api/users/me/permissions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        hydrateForUser({ user: session.user, access_token: session.access_token })
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

  const value: AuthState = {
    user,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: permissions?.isAdmin ?? false,
    isClubAdmin,
    isAlumno,
    adminClubsCount,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
