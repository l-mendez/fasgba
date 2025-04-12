"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient, ensureSession } from "@/lib/supabase-client"

type AuthGuardProps = {
  children: ReactNode
  requiredRole: "admin" | "club-admin"
  redirectPath?: string
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectPath = "/" 
}: AuthGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        // First ensure we have a valid session
        const hasSession = await ensureSession()
        if (!hasSession) {
          console.error("No valid session found")
          router.push(`/login?redirectedFrom=${window.location.pathname}`)
          return
        }
        
        const supabase = getSupabaseClient()
        
        // Get the current user's auth ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Error getting user:", userError)
          router.push(`/login?redirectedFrom=${window.location.pathname}`)
          return
        }
        
        if (requiredRole === "admin") {
          // Check if the user has admin privileges in the users table
          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("page_admin")
            .eq("auth_id", user.id)
            .single()
          
          if (userDataError) {
            console.error("Error checking admin status:", userDataError)
            router.push(`/login?redirectedFrom=${window.location.pathname}`)
            return
          }
          
          if (!userData || !userData.page_admin) {
            console.error("User is not an admin")
            router.push(redirectPath)
            return
          }
        } else if (requiredRole === "club-admin") {
          // Get the user's ID from the users table
          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single()
          
          if (userDataError || !userData) {
            console.error("Error getting user data:", userDataError)
            router.push(`/login?redirectedFrom=${window.location.pathname}`)
            return
          }
          
          // Check if the user has club admin privileges in the club_admins table
          const { data: clubAdmins, error: clubAdminsError } = await supabase
            .from("club_admins")
            .select("club_id")
            .eq("user_id", userData.id)
          
          if (clubAdminsError) {
            console.error("Error checking club admin status:", clubAdminsError)
            router.push(`/login?redirectedFrom=${window.location.pathname}`)
            return
          }
          
          if (!clubAdmins || clubAdmins.length === 0) {
            console.error("User is not a club admin")
            router.push(redirectPath)
            return
          }
        }
        
        // User is authorized
        setIsAuthorized(true)
      } catch (error) {
        console.error(`Error checking ${requiredRole} access:`, error)
        router.push(`/login?redirectedFrom=${window.location.pathname}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAccess()
  }, [router, requiredRole, redirectPath])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 