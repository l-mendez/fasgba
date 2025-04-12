"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  Plus,
  Trophy,
  Users,
} from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClubContextProvider } from "./context/club-context"

interface ClubAdminLayoutProps {
  children: ReactNode
}

export default function ClubAdminLayout({ children }: ClubAdminLayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ClubContextProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 border-r border-amber/20 bg-background transition-transform",
            isCollapsed && "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center border-b border-amber/20 px-4">
            <Link href="/club-admin" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-terracotta" />
              <span className="font-bold text-terracotta">Club Admin</span>
            </Link>
          </div>
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
                    href="/club-admin/miembros"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber/10",
                      pathname.startsWith("/club-admin/miembros") ? "bg-amber/10 text-amber" : "text-muted-foreground"
                    )}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Miembros
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
        <div className={cn("flex-1 transition-all", isCollapsed ? "ml-0" : "ml-64")}>
          <main className="container py-6">{children}</main>
        </div>
      </div>
    </ClubContextProvider>
  )
}

