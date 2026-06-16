"use client"

import { useAuthContext, type AuthState } from '@/components/auth-provider'

export function useAuth(): AuthState {
  return useAuthContext()
}
