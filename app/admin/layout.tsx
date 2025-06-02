"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChessKnight,
  FileText,
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

  // Debug logging
  useEffect(() => {
    console.log('🎯 Admin Layout Debug:', {
      isLoading,
      isAuthenticated,
      isAdmin,
      user: user ? { id: user.id, email: user.email } : null,
      permissions,
      error
    })
  }, [isLoading, isAuthenticated, isAdmin, user, permissions, error])

  // Handle authentication and authorization
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      console.log('⏳ Still loading authentication...')
      return
    }

    // If not authenticated or not admin, redirect to 404
    if (!isAuthenticated || !isAdmin) {
      console.log('❌ Client-side: Redirecting to 404. Auth:', isAuthenticated, 'Admin:', isAdmin)
      router.replace('/not-found')
      return
    }

    console.log('✅ Client-side: Admin access granted')
  }, [isAuthenticated, isAdmin, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <AdminLoadingPage />
  }

  // If not authenticated or not admin, show nothing (redirect is in progress)
  if (!isAuthenticated || !isAdmin) {
    return null
  }

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
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-amber/20 bg-background">
          <div className="flex h-14 items-center border-b border-amber/20 px-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-terracotta" />
              <span className="font-bold text-terracotta">Admin</span>
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
                  <Shield className="h-6 w-6 text-terracotta" />
                  <span className="font-bold text-terracotta">Admin</span>
                </Link>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarContent onLinkClick={() => setIsMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-terracotta" />
            <span className="font-semibold text-terracotta">Panel Admin</span>
          </div>
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

