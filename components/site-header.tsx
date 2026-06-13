import Link from "next/link"

import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { MainNav } from "@/components/main-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-terracotta">
                FASGBA
              </span>
            </Link>
            <MainNav className="flex" />
          </div>

          <div className="flex items-center space-x-4">
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex h-14 items-center gap-x-4 border-b border-amber/20 bg-background px-4">
        <MobileNavigation />
        <div className="flex-1 flex justify-center items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-terracotta">FASGBA</span>
          </Link>
        </div>
        {/* Spacer to balance the hamburger menu and center the title */}
        <div className="w-10 h-10"></div>
      </div>
    </header>
  )
}
