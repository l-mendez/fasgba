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
} from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-amber/20 bg-background transition-transform",
          isCollapsed && "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b border-amber/20 px-4">
          <Link href="/admin" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-terracotta" />
            <span className="font-bold text-terracotta">Admin</span>
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <div className="space-y-1">
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                    pathname === "/admin" ? "bg-amber/10 text-amber" : "text-muted-foreground"
                  )}
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
                >
                  <Home className="mr-2 h-4 w-4" />
                  Clubes
                </Link>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className={cn("flex-1 transition-all", isCollapsed ? "ml-0" : "ml-64")}>
        <main className="container py-6">{children}</main>
      </div>
    </div>
  )
}

