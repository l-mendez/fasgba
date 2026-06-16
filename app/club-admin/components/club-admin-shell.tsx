"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Home,
  Menu,
  Settings,
  Shield,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import type { ClubAdminClub } from "@/lib/club-admin/types"
import { ClubContextProvider } from "../context/club-context"
import { ClubSelector } from "./club-selector"

interface ClubAdminShellProps {
  children: ReactNode
  clubs: ClubAdminClub[]
  selectedClub: ClubAdminClub
}

const navItems: Array<{
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}> = [
  {
    href: "/club-admin",
    label: "Dashboard",
    icon: BarChart3,
    isActive: (pathname) => pathname === "/club-admin",
  },
  {
    href: "/club-admin/jugadores",
    label: "Jugadores",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/club-admin/jugadores"),
  },
  {
    href: "/club-admin/torneos",
    label: "Torneos",
    icon: Trophy,
    isActive: (pathname) => pathname.startsWith("/club-admin/torneos"),
  },
  {
    href: "/club-admin/noticias",
    label: "Noticias",
    icon: FileText,
    isActive: (pathname) => pathname.startsWith("/club-admin/noticias"),
  },
  {
    href: "/club-admin/equipos",
    label: "Equipos",
    icon: Shield,
    isActive: (pathname) => pathname.startsWith("/club-admin/equipos"),
  },
  {
    href: "/club-admin/settings",
    label: "Configuración",
    icon: Settings,
    isActive: (pathname) => pathname.startsWith("/club-admin/settings"),
  },
]

function SidebarContent({
  currentPath,
  onLinkClick,
}: {
  currentPath: string
  onLinkClick?: () => void
}) {
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
                  item.isActive(currentPath) ? "bg-amber/10 text-amber" : "text-muted-foreground"
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

export function ClubAdminShell({ children, clubs, selectedClub }: ClubAdminShellProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <ClubContextProvider initialClubs={clubs} initialSelectedClub={selectedClub}>
      <div className="min-h-screen lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-amber/20 bg-background">
            <div className="flex h-14 items-center border-b border-amber/20 px-4">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold text-terracotta sm:inline-block">
                  FASGBA
                </span>
              </Link>
            </div>
            
            {/* Club Selector */}
            <ClubSelector />
            
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <SidebarContent currentPath={pathname} />
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
                <SheetTitle className="sr-only">Club Admin Navigation</SheetTitle>
                <div className="flex h-14 items-center border-b border-amber/20 px-4 -mx-6 -mt-6 mb-4">
                  <Link href="/club-admin" className="flex items-center space-x-2" onClick={() => setIsMobileOpen(false)}>
                    <Home className="h-6 w-6 text-terracotta" />
                    <span className="font-bold text-terracotta">Club Admin</span>
                  </Link>
                </div>
                
                {/* Club Selector in mobile */}
                <div className="-mx-6 mb-4">
                  <ClubSelector />
                </div>
                
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <SidebarContent currentPath={pathname} onLinkClick={() => setIsMobileOpen(false)} />
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
    </ClubContextProvider>
  )
}
