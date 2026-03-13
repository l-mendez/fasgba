"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  FolderOpen,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Trophy,
  Users,
  Loader2,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"

interface AdminLayoutProps {
  children: ReactNode
}

// Loading component for authentication check
function AdminLoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-terracotta">Verificando permisos</h2>
          <p className="text-muted-foreground">
            Comprobando tu acceso al panel de administración...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isAuthenticated, isAdmin, isLoading, user, permissions, error } = useAuth()

  // Sidebar content component for reuse in both desktop and mobile
  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          <Link
            href="/admin"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname === "/admin" ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/usuarios"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/usuarios") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Users className="mr-2 h-4 w-4" />
            Usuarios
          </Link>
          <Link
            href="/admin/torneos"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/torneos") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Torneos
          </Link>
          <Link
            href="/admin/clubes"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/clubes") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Home className="mr-2 h-4 w-4" />
            Clubes
          </Link>
          <Link
            href="/admin/ranking"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/ranking") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Ranking
          </Link>
          <Link
            href="/admin/noticias"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/noticias") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <FileText className="mr-2 h-4 w-4" />
            Noticias
          </Link>
          <Link
            href="/admin/jugadores"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/jugadores") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Users className="mr-2 h-4 w-4" />
            Jugadores
          </Link>
          <Link
            href="/admin/documentos"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/documentos") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Documentos
          </Link>
          <Link
            href="/admin/profesores"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/profesores") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Profesores
          </Link>
          <Link
            href="/admin/alumnos"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/alumnos") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Alumnos
          </Link>
          <Link
            href="/admin/arbitros"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
              pathname.startsWith("/admin/arbitros") ? "bg-amber/10 text-amber" : "text-muted-foreground"
            )}
            onClick={onLinkClick}
          >
            <Award className="mr-2 h-4 w-4" />
            Árbitros
          </Link>
        </div>
      </div>
    </div>
  )

  // Handle client-side logic
  if (isLoading) {
    return <AdminLoadingPage />
  }

  if (!isAuthenticated || !isAdmin) {
    router.replace('/not-found')
    return null
  }

  // User is authenticated and is an admin
  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-amber/20 bg-background">
          <div className="flex h-14 items-center border-b border-amber/20 px-4">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold text-terracotta sm:inline-block">
              FASGBA
            </span>
          </Link>
          </div>
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <SidebarContent />
          </ScrollArea>
        </div>
      </div>

      {/* Mobile Header and Content */}
      <div className="w-full lg:ml-64">
        {/* Mobile Header with Toggle */}
        <div className="sticky top-0 z-40 flex h-14 items-center gap-x-4 border-b border-amber/20 bg-background px-4 shadow-sm lg:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-terracotta hover:bg-amber/10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-amber/20">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <div className="flex h-14 items-center border-b border-amber/20 px-4 -mx-6 -mt-6 mb-4">
                <Link href="/admin" className="flex items-center space-x-2" onClick={() => setIsMobileOpen(false)}>
                  <span className="font-bold text-terracotta">Admin</span>
                </Link>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarContent onLinkClick={() => setIsMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-center items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-semibold text-terracotta">FASGBA</span>
            </Link>
          </div>
          {/* Spacer to balance the hamburger menu and center the title */}
          <div className="w-10 h-10"></div>
        </div>

        {/* Main content */}
        <main className="w-full py-6 px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

