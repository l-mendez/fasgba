'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface AuthButtonsProps {
  isAuthenticated: boolean
  isAdmin: boolean
  isClubAdmin: boolean
  pathname: string
}

export function AuthButtons({ isAuthenticated, isAdmin, isClubAdmin, pathname }: AuthButtonsProps) {
  const supabase = createClient()
  const router = useRouter()

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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-amber">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Show admin button only if user is admin */}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "rounded-md bg-terracotta/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-terracotta/20",
            pathname === "/admin" ? "text-terracotta" : "text-muted-foreground"
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
            pathname === "/club-admin" ? "text-amber" : "text-muted-foreground"
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
        className="text-muted-foreground hover:text-red-500"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  )
} 