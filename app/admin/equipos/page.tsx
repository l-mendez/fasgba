import { Suspense } from "react"

import { AdminEquiposClient } from "@/app/admin/equipos/equipos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminEquiposInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminEquiposPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <AdminPageHeader title="Equipos" />
          <AdminContentSkeleton rows={5} />
        </div>
      }
    >
      <AdminEquiposContent />
    </Suspense>
  )
}

async function AdminEquiposContent() {
  const { clubs, teamsByClub } = await getAdminEquiposInitialData()

  return <AdminEquiposClient initialClubs={clubs} initialTeamsByClub={teamsByClub} />
}
