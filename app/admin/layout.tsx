"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { getSupabaseClient, ensureSession } from "@/lib/supabase-client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminLayoutProps {
  children: ReactNode
}

interface AdminUser {
  id: number
  name: string
  surname: string
  email: string
  profile_picture: string | null
  role?: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Create Supabase client
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Use mock data instead of fetching from Supabase
        setAdmin({
          id: 1,
          name: "Admin",
          surname: "User",
          email: "admin@example.com",
          profile_picture: null,
          role: 'Administrador FASGBA'
        })
      } catch (error) {
        console.error('Error in fetchUserData:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Elementos de navegación del sidebar
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Clubes",
      href: "/admin/clubes",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Noticias",
      href: "/admin/noticias",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Torneos",
      href: "/admin/torneos",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Comentarios",
      href: "/admin/comentarios",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Estadísticas",
      href: "/admin/estadisticas",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Reglamentos",
      href: "/admin/reglamentos",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Usuarios",
      href: "/admin/usuarios",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Cursos",
      href: "/admin/cursos",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      title: "Historia",
      href: "/admin/historia",
      icon: <History className="h-5 w-5" />,
    },
    {
      title: "Configuración",
      href: "/admin/configuracion",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-terracotta">
            <Shield className="mx-auto h-12 w-12" />
          </div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  // If no admin data is available, don't render the layout
  if (!admin) return null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-terracotta" />
          <span className="text-terracotta">FASGBA Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" target="_blank">
              Ver sitio
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.profile_picture || undefined} alt={`${admin.name} ${admin.surname}`} />
                  <AvatarFallback className="bg-amber/10 text-amber-dark">
                    {`${admin.name.charAt(0)}${admin.surname.charAt(0)}`}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{`${admin.name} ${admin.surname}`}</p>
                  <p className="text-xs leading-none text-muted-foreground">{admin.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/perfil">Mi perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/configuracion">Configuración</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/40">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="flex h-full flex-col gap-2 p-4">
              <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10 hover:text-amber-dark",
                      pathname === item.href && "bg-amber/10 text-amber-dark",
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto">
                <div className="flex h-16 items-center gap-3 border-t px-6">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Cerrar sesión" 
                    className="text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{`${admin.name} ${admin.surname}`}</span>
                    <span className="text-xs text-muted-foreground">{admin.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

