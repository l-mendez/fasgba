"use client"

import Link from "next/link"

import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { MainNav } from "@/components/main-nav"
import { useAuth } from "@/hooks/useAuth"

export function ClientSiteHeader() {
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
          <MainNav className="hidden md:flex" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {!isLoading && (
            <AuthButtons
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isClubAdmin={isClubAdmin}
            />
          )}
        </div>

        {/* Mobile Navigation */}
        {!isLoading && (
          <MobileNavigation
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            isClubAdmin={isClubAdmin}
          />
        )}
      </div>
    </header>
  )
}
