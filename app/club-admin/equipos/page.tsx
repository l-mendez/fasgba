import { Suspense } from "react"

import { ClubAdminEquipos } from "./equipos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubTeamsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default function ClubAdminEquiposPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Equipos"
        subtitle="Gestiona los equipos del club seleccionado."
      />
      <Suspense fallback={<AdminContentSkeleton rows={5} filters={false} />}>
        <ClubAdminEquiposContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminEquiposContent() {
  const { selectedClub, selectedClubId, teams } = await getClubTeamsInitialData()

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{selectedClub.name}</p>
      <ClubAdminEquipos
        showHeader={false}
        showSummary={false}
        initialClubId={selectedClubId}
        initialTeams={teams}
      />
    </div>
  )
}
