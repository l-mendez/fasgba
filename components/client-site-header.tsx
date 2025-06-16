"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CastleIcon as ChessKnight, Menu, X, Bell, User, Settings, Trophy, Calendar, Home, FileText, Shield, LogOut, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
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
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setUser(null)
          setLoading(false)
          return
        }

        // Check if user is an admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('auth_id')
          .eq('auth_id', user.id)
          .single()

        // Check if user is a club admin
        const { data: clubAdminData, error: clubAdminError } = await supabase
          .from('club_admins')
          .select('auth_id, club_id')
          .eq('auth_id', user.id)

        const userData = {
          id: user.id,
          email: user.email,
          isAdmin: !!adminData,
          isClubAdmin: !!(clubAdminData && clubAdminData.length > 0),
          clubAdminClubs: clubAdminData || []
        }

        setUser(userData)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Initial user fetch
    getUser()

    // Listen for auth state changes
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
    <header className="sticky top-0 z-50 w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
  )
} 