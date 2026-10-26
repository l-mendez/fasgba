import { Suspense } from "react"

import { ClubAdminEquipos } from "./equipos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubTeamsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default function ClubAdminEquiposPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Equipos" />
      <Suspense fallback={<AdminContentSkeleton rows={5} filters={false} />}>
        <ClubAdminEquiposContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminEquiposContent() {
  const { selectedClubId, teams } = await getClubTeamsInitialData()

  return (
    <ClubAdminEquipos
      showHeader={false}
      showSummary={false}
      initialClubId={selectedClubId}
      initialTeams={teams}
    />
  )
}
