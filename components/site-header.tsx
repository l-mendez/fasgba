"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { CastleIcon as ChessKnight, LogIn, Menu, X, Bell, User, LogOut, Settings, Trophy, Calendar, Home } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

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

interface User {
  id: string
  email: string
  user_metadata: {
    name?: string
    surname?: string
    profile_picture?: string
  }
}

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error.message)
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Error in getUser:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const userName = user?.user_metadata?.name
    ? `${user.user_metadata.name} ${user.user_metadata.surname || ''}`
    : user?.email?.split('@')[0] || ''

  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ChessKnight className="h-6 w-6 text-terracotta" />
            <span className="font-bold text-terracotta">FASGBA</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.profile_picture || undefined} alt={userName} />
                        <AvatarFallback className="bg-amber/10 text-amber-dark">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/perfil">Mi perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/configuracion">Configuración</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden md:flex border-amber text-terracotta hover:bg-amber/10 hover:text-terracotta"
                >
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar sesión
                  </Link>
                </Button>
              )}

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Menu"
                    className="text-terracotta hover:bg-amber/10 hover:text-terracotta"
                  >
                    <Menu className="h-5 w-5" />
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

                  {user && (
                    <div className="mt-6 mb-6 flex items-center gap-4 border-b border-amber/20 pb-6">
                      <Avatar className="h-10 w-10 border border-amber/20">
                        <AvatarImage src={user.user_metadata?.profile_picture || undefined} alt={userName} />
                        <AvatarFallback className="bg-amber/10 text-amber-dark">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-terracotta">{userName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  )}

                  <nav className="flex flex-col space-y-4">
                    <Link
                      href="/"
                      className={cn(
                        "flex items-center text-muted-foreground hover:text-amber",
                        pathname === "/" && "text-amber"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Home className="mr-2 h-5 w-5" />
                      <span>Inicio</span>
                    </Link>
                    <Link
                      href="/torneos"
                      className={cn(
                        "flex items-center text-muted-foreground hover:text-amber",
                        pathname.startsWith("/torneos") && "text-amber"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Trophy className="mr-2 h-5 w-5" />
                      <span>Torneos</span>
                    </Link>
                    <Link
                      href="/calendario"
                      className={cn(
                        "flex items-center text-muted-foreground hover:text-amber",
                        pathname.startsWith("/calendario") && "text-amber"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      <span>Calendario</span>
                    </Link>
                    <Link
                      href="/noticias"
                      className={cn(
                        "flex items-center text-muted-foreground hover:text-amber",
                        pathname.startsWith("/noticias") && "text-amber"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Bell className="mr-2 h-5 w-5" />
                      <span>Noticias</span>
                    </Link>

                    {user ? (
                      <div className="pt-4 mt-4 border-t border-amber/20 space-y-4">
                        <Link
                          href="/perfil"
                          className="flex items-center text-muted-foreground hover:text-amber"
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="mr-2 h-5 w-5 text-amber" />
                          <span>Mi perfil</span>
                        </Link>
                        <Link
                          href="/mis-torneos"
                          className="flex items-center text-muted-foreground hover:text-amber"
                          onClick={() => setIsOpen(false)}
                        >
                          <Trophy className="mr-2 h-5 w-5 text-amber" />
                          <span>Mis torneos</span>
                        </Link>
                        <Link
                          href="/configuracion"
                          className="flex items-center text-muted-foreground hover:text-amber"
                          onClick={() => setIsOpen(false)}
                        >
                          <Settings className="mr-2 h-5 w-5 text-amber" />
                          <span>Configuración</span>
                        </Link>
                        <button
                          className="flex w-full items-center text-destructive hover:text-destructive/80"
                          onClick={() => {
                            handleLogout()
                            setIsOpen(false)
                          }}
                        >
                          <LogOut className="mr-2 h-5 w-5" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 mt-4 border-t border-amber/20">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start border-amber text-terracotta hover:bg-amber/10 hover:text-terracotta"
                        >
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            <LogIn className="h-4 w-4 mr-2" />
                            Iniciar sesión
                          </Link>
                        </Button>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

