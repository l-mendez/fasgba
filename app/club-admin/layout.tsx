import type { ReactNode } from "react"

import { ClubAdminShell } from "./components/club-admin-shell"
import { getClubAdminContext } from "@/lib/club-admin/initial-data"

interface ClubAdminLayoutProps {
  children: ReactNode
}

export const dynamic = "force-dynamic"

export default async function ClubAdminLayout({ children }: ClubAdminLayoutProps) {
  const { clubs, selectedClub } = await getClubAdminContext()

  return (
    <ClubAdminShell clubs={clubs} selectedClub={selectedClub}>
      {children}
    </ClubAdminShell>
  )
}
