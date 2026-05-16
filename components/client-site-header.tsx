"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { useAuth } from "@/hooks/useAuth"

interface ClientSiteHeaderProps {
  pathname: string
}

export function ClientSiteHeader({ pathname }: ClientSiteHeaderProps) {
  const { isAuthenticated, isAdmin, isClubAdmin, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-terracotta sm:inline-block">
              FASGBA
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Inicio
            </Link>
            <Link
              href="/torneos"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/torneos" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Torneos
            </Link>
            <Link
              href="/clubes"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/clubes" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Clubes
            </Link>
            <Link
              href="/ranking"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/ranking" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Ranking
            </Link>
            <Link
              href="/noticias"
              className={cn(
                "transition-colors hover:text-amber",
                pathname === "/noticias" ? "text-amber" : "text-muted-foreground"
              )}
            >
              Noticias
            </Link>
          </nav>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {!isLoading && (
            <AuthButtons
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isClubAdmin={isClubAdmin}
              pathname={pathname}
            />
          )}
        </div>

        {/* Mobile Navigation */}
        {!isLoading && (
          <MobileNavigation
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            isClubAdmin={isClubAdmin}
            pathname={pathname}
          />
        )}
      </div>
    </header>
  )
}
