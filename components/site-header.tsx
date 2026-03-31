import Link from "next/link"
import { CastleIcon as ChessKnight, Menu, X, Bell, User, Settings, Trophy, Calendar, Home, FileText, Shield, LogOut, BarChart3 } from "lucide-react"
import { cookies } from "next/headers"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { ScrollHeader } from "@/components/scroll-header"
import { createClient } from "@/lib/supabase/server"

interface SiteHeaderProps {
  pathname: string
}

async function getUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
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

    return userData
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function SiteHeader({ pathname }: SiteHeaderProps) {
  const user = await getUser()
  
  const isAuthenticated = !!user
  const isAdmin = user?.isAdmin || false
  const isClubAdmin = user?.isClubAdmin || false

  return (
    <ScrollHeader>
    <header className="w-full border-b border-amber/30 dark:border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-terracotta">
                FASGBA
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
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
              <Link
                href="/documentos"
                className={cn(
                  "transition-colors hover:text-amber",
                  pathname === "/documentos" ? "text-amber" : "text-muted-foreground"
                )}
              >
                Documentos
              </Link>
              <Link
                href="/profesores"
                className={cn(
                  "transition-colors hover:text-amber",
                  pathname === "/profesores" ? "text-amber" : "text-muted-foreground"
                )}
              >
                Profesores
              </Link>
              <Link
                href="/arbitraje"
                className={cn(
                  "transition-colors hover:text-amber",
                  pathname === "/arbitraje" ? "text-amber" : "text-muted-foreground"
                )}
              >
                Arbitraje
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <AuthButtons 
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isClubAdmin={isClubAdmin}
              pathname={pathname}
            />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex h-14 items-center gap-x-4 border-b border-amber/30 dark:border-amber/20 bg-background px-4">
        <MobileNavigation 
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          isClubAdmin={isClubAdmin}
          pathname={pathname}
        />
        <div className="flex-1 flex justify-center items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-terracotta">FASGBA</span>
          </Link>
        </div>
        {/* Spacer to balance the hamburger menu and center the title */}
        <div className="w-10 h-10"></div>
      </div>
    </header>
    </ScrollHeader>
  )
}

