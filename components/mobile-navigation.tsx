'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CastleIcon as ChessKnight, Menu, User, Settings, Trophy, Home, FileText, Shield, LogOut, BarChart3 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"

interface MobileNavigationProps {
  isAuthenticated: boolean
  isAdmin: boolean
  isClubAdmin: boolean
  pathname: string
}

export function MobileNavigation({ isAuthenticated, isAdmin, isClubAdmin, pathname }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6 text-terracotta" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] border-amber/20">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <span className="font-bold text-terracotta">FASGBA</span>
          </Link>
        </div>
        <nav className="flex flex-col space-y-4 mt-6">
          <Link
            href="/"
            className="flex items-center text-muted-foreground hover:text-amber"
            onClick={() => setIsOpen(false)}
          >
            <Home className="mr-2 h-5 w-5 text-amber" />
            <span>Inicio</span>
          </Link>
          <Link
            href="/torneos"
            className="flex items-center text-muted-foreground hover:text-amber"
            onClick={() => setIsOpen(false)}
          >
            <Trophy className="mr-2 h-5 w-5 text-amber" />
            <span>Torneos</span>
          </Link>
          <Link
            href="/clubes"
            className="flex items-center text-muted-foreground hover:text-amber"
            onClick={() => setIsOpen(false)}
          >
            <ChessKnight className="mr-2 h-5 w-5 text-amber" />
            <span>Clubes</span>
          </Link>
          <Link
            href="/ranking"
            className="flex items-center text-muted-foreground hover:text-amber"
            onClick={() => setIsOpen(false)}
          >
            <BarChart3 className="mr-2 h-5 w-5 text-amber" />
            <span>Ranking</span>
          </Link>
          <Link
            href="/noticias"
            className="flex items-center text-muted-foreground hover:text-amber"
            onClick={() => setIsOpen(false)}
          >
            <FileText className="mr-2 h-5 w-5 text-amber" />
            <span>Noticias</span>
          </Link>
          
          <div className="my-2 border-t border-amber/20" />
          
          {!isAuthenticated ? (
            // Mobile login/signup buttons
            <>
              <Link
                href="/login"
                className="flex items-center text-muted-foreground hover:text-amber"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-5 w-5 text-amber" />
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                href="/registro"
                className="flex items-center text-muted-foreground hover:text-terracotta"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-5 w-5 text-terracotta" />
                <span>Registrarse</span>
              </Link>
            </>
          ) : (
            // Mobile authenticated content
            <>
              <Link
                href="/ajustes"
                className="flex items-center text-muted-foreground hover:text-amber"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="mr-2 h-5 w-5 text-amber" />
                <span>Ajustes</span>
              </Link>
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center text-muted-foreground hover:text-terracotta"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="mr-2 h-5 w-5 text-amber" />
                  <span>Admin</span>
                </Link>
              )}
              
              {isClubAdmin && (
                <Link
                  href="/club-admin"
                  className="flex items-center text-muted-foreground hover:text-amber"
                  onClick={() => setIsOpen(false)}
                >
                  <ChessKnight className="mr-2 h-5 w-5 text-amber" />
                  <span>Club Admin</span>
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout()
                  setIsOpen(false)
                }}
                className="flex items-center text-muted-foreground hover:text-red-500 text-left"
              >
                <LogOut className="mr-2 h-5 w-5 text-red-500" />
                <span>Cerrar Sesión</span>
              </button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
} 