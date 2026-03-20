"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CastleIcon as ChessKnight, Menu, X, Bell, User, Settings, Trophy, Calendar, Home, FileText, Shield, LogOut, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { ScrollHeader } from "@/components/scroll-header"
import { createClient } from "@/lib/supabase/client"

interface ClientSiteHeaderProps {
  pathname: string
}

export function ClientSiteHeader({ pathname }: ClientSiteHeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          setUser(null)
          setLoading(false)
          return
        }

        const res = await fetch('/api/users/me/permissions', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (!res.ok) {
          setUser({ id: session.user.id, email: session.user.email, isAdmin: false, isClubAdmin: false, clubAdminClubs: [] })
          setLoading(false)
          return
        }

        const data = await res.json()

        setUser({
          id: session.user.id,
          email: session.user.email,
          isAdmin: data.isAdmin,
          isClubAdmin: data.isClubAdmin,
          clubAdminClubs: data.clubAdminClubs || []
        })
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getUser()
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!user
  const isAdmin = user?.isAdmin || false
  const isClubAdmin = user?.isClubAdmin || false

  return (
    <ScrollHeader>
    <header className="w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-terracotta sm:inline-block">
              FASGBA
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Inicio
            </Link>
            <Link
              href="/torneos"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/torneos" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Torneos
            </Link>
            <Link
              href="/clubes"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/clubes" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Clubes
            </Link>
            <Link
              href="/ranking"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/ranking" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Ranking
            </Link>
            <Link
              href="/noticias"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/noticias" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Noticias
            </Link>
          </nav>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {!loading && (
            <AuthButtons
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isClubAdmin={isClubAdmin}
              pathname={pathname}
            />
          )}
        </div>

        {/* Mobile Navigation */}
        {!loading && (
          <MobileNavigation
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            isClubAdmin={isClubAdmin}
            pathname={pathname}
          />
        )}
      </div>
    </header>
    </ScrollHeader>
  )
}
