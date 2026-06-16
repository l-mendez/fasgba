import type { ReactNode } from "react"
import Link from "next/link"

import type { ClubAdminClub } from "@/lib/club-admin/types"
import { ClubContextProvider } from "../context/club-context"
import { ClubAdminMobileHeader, ClubAdminNavLinks } from "./club-admin-nav-client"
import { ClubSelector } from "./club-selector"

interface ClubAdminShellProps {
  children: ReactNode
  clubs: ClubAdminClub[]
  selectedClub: ClubAdminClub
}

export function ClubAdminShell({ children, clubs, selectedClub }: ClubAdminShellProps) {
  return (
    <ClubContextProvider initialClubs={clubs} initialSelectedClub={selectedClub}>
      <div className="min-h-screen lg:flex">
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow border-r border-amber/20 bg-background">
            <div className="flex h-14 items-center border-b border-amber/20 px-4">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold text-terracotta sm:inline-block">
                  FASGBA
                </span>
              </Link>
            </div>
            <ClubSelector />
            <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
              <ClubAdminNavLinks />
            </div>
          </div>
        </div>

        <div className="w-full lg:ml-64">
          <ClubAdminMobileHeader />
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
