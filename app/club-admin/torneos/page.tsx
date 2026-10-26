import { Suspense } from "react"
import type { Metadata } from "next"

import { ClubAdminTorneos } from "./torneos-client"
import { ClubAdminChessResultsImport } from "./chess-results-import"
import { ClubAdminNewButton } from "../components/club-admin-new-button"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubTournamentsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Torneos del club" }

export default function ClubAdminTorneosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Torneos"
        action={<ClubAdminNewButton path="/torneos/nuevo" label="Nuevo torneo" />}
      />
      <ClubAdminChessResultsImport />
      <Suspense fallback={<AdminContentSkeleton rows={6} />}>
        <ClubAdminTorneosContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminTorneosContent() {
  const { selectedClubId, tournaments } = await getClubTournamentsInitialData()

  return <ClubAdminTorneos initialClubId={selectedClubId} initialTournaments={tournaments} />
}
