"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Plus,
  Trophy,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClubContextProvider } from "./context/club-context"
import { ClubSelector } from "./components/club-selector"

interface ClubAdminLayoutProps {
  children: ReactNode
}

export default function ClubAdminLayout({ children }: ClubAdminLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <ClubContextProvider>
      <div className="flex min-h-screen">
        {/* Mobile menu button */}
        <div className="fixed top-4 left-4 z-50 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-background"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Overlay for mobile */}
        {isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 border-r border-amber/20 bg-background transition-transform lg:translate-x-0",
            isMobile && !isMobileMenuOpen && "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center border-b border-amber/20 px-4">
            <Link href="/club-admin" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-terracotta" />
              <span className="font-bold text-terracotta">Club Admin</span>
            </Link>
          </div>
          
          {/* Club Selector */}
          <ClubSelector />
          
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="space-y-4 py-4">
              <div className="px-3 py-2">
                <div className="space-y-1">
                  <Link
                    href="/club-admin"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                      pathname === "/club-admin" ? "bg-amber/10 text-amber" : "text-muted-foreground"
                    )}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/club-admin/noticias"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                      pathname.startsWith("/club-admin/noticias") ? "bg-amber/10 text-amber" : "text-muted-foreground"
                    )}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Noticias
                  </Link>
                  <Link
                    href="/club-admin/torneos"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                      pathname.startsWith("/club-admin/torneos") ? "bg-amber/10 text-amber" : "text-muted-foreground"
                    )}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Torneos
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          <main className="container py-6 px-4 lg:px-6 pt-16 lg:pt-6">{children}</main>
        </div>
      </div>
    </ClubContextProvider>
  )
}

