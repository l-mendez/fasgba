import { Suspense } from "react"
import type { Metadata } from "next"

import { ClubAdminEquipos } from "./equipos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubTeamsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Equipos del club" }

export default function ClubAdminEquiposPage() {
  return (
    // The client renders the header so "Nuevo equipo" can sit in its action slot.
    <Suspense
      fallback={
        <div className="space-y-6">
          <AdminPageHeader title="Equipos" />
          <AdminContentSkeleton rows={5} filters={false} />
        </div>
      }
    >
      <ClubAdminEquiposContent />
    </Suspense>
  )
}

async function ClubAdminEquiposContent() {
  const { selectedClubId, teams } = await getClubTeamsInitialData()

  return (
    <ClubAdminEquipos
      initialClubId={selectedClubId}
      initialTeams={teams}
    />
  )
}
