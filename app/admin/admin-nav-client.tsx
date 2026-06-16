"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Award,
  BarChart3,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  Shield,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems: Array<{
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}> = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/admin/usuarios"),
  },
  {
    href: "/admin/torneos",
    label: "Torneos",
    icon: Trophy,
    isActive: (pathname) => pathname.startsWith("/admin/torneos"),
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
    icon: GraduationCap,
    isActive: (pathname) => pathname.startsWith("/admin/alumnos"),
  },
  {
    href: "/admin/arbitros",
    label: "Árbitros",
    icon: Award,
    isActive: (pathname) => pathname.startsWith("/admin/arbitros"),
  },
]

interface AdminNavLinksProps {
  onLinkClick?: () => void
}

export function AdminNavLinks({ onLinkClick }: AdminNavLinksProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                  item.isActive(pathname) ? "bg-amber/10 text-amber" : "text-muted-foreground"
                )}
                onClick={onLinkClick}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
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
