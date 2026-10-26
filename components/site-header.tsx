import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { MainNav } from "@/components/main-nav"
import { SiteLogo } from "@/components/site-logo"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop */}
      <div className="container hidden h-14 items-center justify-between gap-6 lg:flex">
        <div className="flex items-center gap-6 xl:gap-8">
          <SiteLogo />
          <MainNav className="flex" />
        </div>
        <AuthButtons />
      </div>

      {/* Mobile: menu, centered logo, and a spacer matching the menu button */}
      <div className="flex h-14 items-center px-4 lg:hidden">
        <MobileNavigation />
        <div className="flex flex-1 justify-center">
          <SiteLogo />
        </div>
        <div className="h-10 w-10" />
      </div>
    </header>
  )
}
