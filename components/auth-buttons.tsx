'use client'

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { CastleIcon, LogOut, Settings, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"

// Signs out and returns to the home page. Shared with the mobile menu.
export function useSignOut() {
  const router = useRouter()

  return async () => {
    try {
      const { error } = await createClient().auth.signOut()
      if (error) {
        console.error('Error signing out:', error.message)
        return
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error during logout:', error)
    }
  }
}

export function AuthButtons() {
  const { isAuthenticated, isAdmin, isClubAdmin, isLoading } = useAuth()
  const signOut = useSignOut()
  const pathname = usePathname()

  // While the session resolves, hold the layout with a fixed-size placeholder
  // so there's no flash of logged-out state and no layout shift.
  if (isLoading) {
    return (
      <div className="flex items-center gap-2" aria-hidden="true">
        <Skeleton className="h-9 w-[118px]" />
        <Skeleton className="h-9 w-[106px]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="border-terracotta/40 text-terracotta hover:text-terracotta">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild size="sm" className="bg-terracotta text-white hover:bg-terracotta/90">
          <Link href="/registro">Registrarse</Link>
        </Button>
      </div>
    )
  }

  const roleLink = (href: string, label: string, Icon: typeof Shield) => (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(pathname.startsWith(href) ? "text-terracotta" : "text-muted-foreground")}
    >
      <Link href={href}>
        <Icon />
        {label}
      </Link>
    </Button>
  )

  return (
    <div className="flex items-center gap-1">
      {isAdmin && roleLink("/admin", "Admin", Shield)}
      {isClubAdmin && roleLink("/club-admin", "Club Admin", CastleIcon)}
      <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
        <Link href="/ajustes" aria-label="Ajustes" title="Ajustes">
          <Settings />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="text-muted-foreground"
      >
        <LogOut />
      </Button>
    </div>
  )
}
