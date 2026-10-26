'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { CastleIcon, LogIn, LogOut, Menu, Settings, Shield, UserPlus, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { SiteLogo } from "@/components/site-logo"
import { isActivePath, navLinks } from "@/components/main-nav"
import { useSignOut } from "@/components/auth-buttons"

// Same hover surface as ghost buttons (accent token), readable in light and dark.
const itemClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"

export function MobileNavigation() {
  const { isAuthenticated, isAdmin, isClubAdmin, canViewDocumentos, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const signOut = useSignOut()
  const close = () => setIsOpen(false)

  const item = (href: string, label: string, Icon: LucideIcon) => (
    <Link
      key={href}
      href={href}
      onClick={close}
      className={cn(itemClass, isActivePath(pathname, href) ? "text-terracotta" : "text-foreground")}
    >
      <Icon className="h-5 w-5 text-amber" />
      {label}
    </Link>
  )

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú" title="Menú" className="text-terracotta md:hidden [&_svg]:size-6">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-4 sm:w-[360px]">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="px-3 py-1">
          <SiteLogo onClick={close} />
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {navLinks
            .filter((link) => !link.restricted || canViewDocumentos)
            .map(({ href, label, icon }) => item(href, label, icon))}

          <div className="my-2 border-t" />

          {isLoading ? (
            // Hold space while the session resolves: no flash of logged-out state.
            <div className="flex flex-col gap-3 px-3 py-2" aria-hidden="true">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>
          ) : !isAuthenticated ? (
            <>
              {item("/login", "Iniciar Sesión", LogIn)}
              {item("/registro", "Registrarse", UserPlus)}
            </>
          ) : (
            <>
              {isAdmin && item("/admin", "Admin", Shield)}
              {isClubAdmin && item("/club-admin", "Club Admin", CastleIcon)}
              {item("/ajustes", "Ajustes", Settings)}
              <button
                type="button"
                onClick={() => {
                  close()
                  signOut()
                }}
                className={cn(itemClass, "text-foreground")}
              >
                <LogOut className="h-5 w-5 text-amber" />
                Cerrar Sesión
              </button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
