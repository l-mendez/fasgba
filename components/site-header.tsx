import Link from "next/link"

import { MobileNavigation } from "@/components/mobile-navigation"
import { AuthButtons } from "@/components/auth-buttons"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  try {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    // Check if user is a club admin
    const { data: clubAdminData, error: clubAdminError } = await supabase
      .from('club_admins')
      .select('auth_id, club_id')
      .eq('auth_id', user.id)

    const userData = {
      id: user.id,
      email: user.email,
      isAdmin: !!adminData,
      isClubAdmin: !!(clubAdminData && clubAdminData.length > 0),
      clubAdminClubs: clubAdminData || []
    }

    return userData
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function SiteHeader() {
  const user = await getUser()

  const isAuthenticated = !!user
  const isAdmin = user?.isAdmin || false
  const isClubAdmin = user?.isClubAdmin || false

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
            <AuthButtons
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isClubAdmin={isClubAdmin}
            />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex h-14 items-center gap-x-4 border-b border-amber/20 bg-background px-4">
        <MobileNavigation
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          isClubAdmin={isClubAdmin}
        />
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
