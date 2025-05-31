"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CastleIcon as ChessKnight, Menu, X, Bell, User, Settings, Trophy, Calendar, Home, FileText, Shield, LogOut, BarChart3 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"

export function SiteHeader() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, isAdmin, isClubAdmin, isLoading } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ChessKnight className="h-6 w-6 text-terracotta" />
            <span className="hidden font-bold text-terracotta sm:inline-block">
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
          </nav>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {!isLoading && (
            <>
              {!isAuthenticated ? (
                // Show login/signup buttons when not authenticated
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-sm font-medium transition-colors hover:text-amber">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/registro">
                    <Button className="bg-terracotta hover:bg-terracotta/90 text-white text-sm font-medium">
                      Registrarse
                    </Button>
                  </Link>
                </>
              ) : (
                // Show authenticated user content
                <>
                  <Link href="/perfil">
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="@user" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
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
              )}
            </>
          )}
        </div>

        {/* Mobile Navigation */}
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
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                <ChessKnight className="h-6 w-6 text-terracotta" />
                <span className="font-bold text-terracotta">FASGBA</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-terracotta hover:bg-amber/10 hover:text-terracotta"
              >
                <X className="h-5 w-5" />
              </Button>
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
              
              {!isLoading && (
                <>
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
                        href="/perfil"
                        className="flex items-center text-muted-foreground hover:text-amber"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="mr-2 h-5 w-5 text-amber" />
                        <span>Perfil</span>
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center text-muted-foreground hover:text-terracotta"
                          onClick={() => setIsOpen(false)}
                        >
                          <Shield className="mr-2 h-5 w-5 text-terracotta" />
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
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

