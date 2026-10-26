"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Award,
  BarChart3,
  BookOpen,
  CastleIcon,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { useSignOut } from "@/components/auth-buttons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

const linkClass = "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"

const navItems: Array<{
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}> = [
  {
    href: "/admin",
    label: "Panel",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: UserCog,
    isActive: (pathname) => pathname.startsWith("/admin/usuarios"),
  },
  {
    href: "/admin/torneos",
    label: "Torneos",
    icon: Trophy,
    isActive: (pathname) => pathname.startsWith("/admin/torneos"),
  },
  {
    href: "/admin/chess-results",
    label: "Chess-results",
    icon: Inbox,
    isActive: (pathname) => pathname.startsWith("/admin/chess-results"),
  },
  {
    href: "/admin/clubes",
    label: "Clubes",
    icon: Home,
    isActive: (pathname) => pathname.startsWith("/admin/clubes"),
  },
  {
    href: "/admin/equipos",
    label: "Equipos",
    icon: Shield,
    isActive: (pathname) => pathname.startsWith("/admin/equipos"),
  },
  {
    href: "/admin/ranking",
    label: "Ranking",
    icon: BarChart3,
    isActive: (pathname) => pathname.startsWith("/admin/ranking"),
  },
  {
    href: "/admin/noticias",
    label: "Noticias",
    icon: FileText,
    isActive: (pathname) => pathname.startsWith("/admin/noticias"),
  },
  {
    href: "/admin/jugadores",
    label: "Jugadores",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/admin/jugadores"),
  },
  {
    href: "/admin/documentos",
    label: "Documentos",
    icon: FolderOpen,
    isActive: (pathname) => pathname.startsWith("/admin/documentos"),
  },
  {
    href: "/admin/profesores",
    label: "Profesores",
    icon: GraduationCap,
    isActive: (pathname) => pathname.startsWith("/admin/profesores"),
  },
  {
    href: "/admin/alumnos",
    label: "Alumnos",
    icon: BookOpen,
    isActive: (pathname) => pathname.startsWith("/admin/alumnos"),
  },
  {
    href: "/admin/arbitros",
    label: "Árbitros",
    icon: Award,
    isActive: (pathname) => pathname.startsWith("/admin/arbitros"),
  },
  {
    href: "/admin/paises",
    label: "Países",
    icon: Globe,
    isActive: (pathname) => pathname.startsWith("/admin/paises"),
  },
]

interface AdminNavLinksProps {
  onLinkClick?: () => void
}

export function AdminNavLinks({ onLinkClick }: AdminNavLinksProps) {
  const pathname = usePathname()
  const { isClubAdmin } = useAuth()
  const signOut = useSignOut()

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                linkClass,
                item.isActive(pathname) ? "bg-accent text-terracotta" : "text-muted-foreground"
              )}
              onClick={onLinkClick}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="space-y-1 border-t border-amber/20 px-3 pt-4">
        {isClubAdmin ? (
          <Link href="/club-admin" className={cn(linkClass, "text-muted-foreground")} onClick={onLinkClick}>
            <CastleIcon className="mr-2 h-4 w-4" />
            Club admin
          </Link>
        ) : null}
        <Link href="/ajustes" className={cn(linkClass, "text-muted-foreground")} onClick={onLinkClick}>
          <Settings className="mr-2 h-4 w-4" />
          Ajustes
        </Link>
        <button
          type="button"
          className={cn(linkClass, "w-full text-muted-foreground")}
          onClick={() => {
            onLinkClick?.()
            void signOut()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export function AdminMobileHeader() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-x-4 border-b border-amber/20 bg-background px-4 shadow-sm lg:hidden">
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-terracotta hover:bg-amber/10">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-amber/20">
          <SheetTitle className="sr-only">Navegación de administración</SheetTitle>
          <div className="flex h-14 items-center border-b border-amber/20 px-4 -mx-6 -mt-6 mb-4">
            <Link href="/admin" className="flex items-center space-x-2" onClick={() => setIsMobileOpen(false)}>
              <span className="font-bold text-terracotta">Admin</span>
            </Link>
          </div>
          <div className="h-[calc(100vh-8rem)] overflow-y-auto">
            <AdminNavLinks onLinkClick={() => setIsMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex justify-center items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-semibold text-terracotta">FASGBA</span>
        </Link>
      </div>
      <div className="w-10 h-10" />
    </div>
  )
}
