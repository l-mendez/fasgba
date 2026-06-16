import { Suspense } from "react"

import { AdminEquiposClient } from "@/app/admin/equipos/equipos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminEquiposInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminEquiposPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Equipos"
        subtitle="Gestiona los equipos de los clubes afiliados."
      />
      <Suspense fallback={<AdminContentSkeleton rows={5} />}>
        <AdminEquiposContent />
      </Suspense>
    </div>
  )
}

async function AdminEquiposContent() {
  const { clubs, teamsByClub } = await getAdminEquiposInitialData()
  const totalTeams = Object.values(teamsByClub).flat().length

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {totalTeams} equipo{totalTeams !== 1 ? 's' : ''} en {clubs.length} clubes
      </p>
      <AdminEquiposClient
        showHeader={false}
        showSummary={false}
        initialClubs={clubs}
        initialTeamsByClub={teamsByClub}
      />
    </div>
  )
}
