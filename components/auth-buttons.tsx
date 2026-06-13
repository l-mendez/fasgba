'use client'

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export function AuthButtons() {
  const { isAuthenticated, isAdmin, isClubAdmin, isLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error.message)
        return
      }
      
      // Redirect to home page after successful logout
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error during logout:', error)
    }
  }

  // While the session resolves, hold the layout with a fixed-size placeholder
  // so there's no flash of logged-out state and no layout shift.
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4" aria-hidden="true">
        <Skeleton className="h-10 w-[124px]" />
        <Skeleton className="h-10 w-[112px]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <Link href="/login">
          <Button variant="brand" className="text-sm font-medium bg-background hover:bg-background border-terracotta/40 hover:border-terracotta">
            Iniciar Sesión
          </Button>
        </Link>
        <Link href="/registro">
          <Button className="bg-terracotta hover:bg-terracotta/90 text-white text-sm font-medium">
            Registrarse
          </Button>
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/ajustes">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-amber dark:hover:bg-amber/20">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Show admin button only if user is admin */}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "rounded-md bg-terracotta/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-terracotta/20",
            pathname.startsWith("/admin") ? "text-terracotta" : "text-muted-foreground"
          )}
        >
          Admin
        </Link>
      )}
      
      {/* Show club admin button only if user is club admin */}
      {isClubAdmin && (
        <Link
          href="/club-admin"
          className={cn(
            "rounded-md bg-amber/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-amber/20",
            pathname.startsWith("/club-admin") ? "text-amber" : "text-muted-foreground"
          )}
        >
          Club Admin
        </Link>
      )}
      
      {/* Logout button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-red-500 dark:hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  )
} 