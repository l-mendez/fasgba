import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { ClubAdminTorneos } from "./torneos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { getClubTournamentsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default function ClubAdminTorneosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Torneos"
        action={
          <Button asChild className="w-fit">
            <Link href="/torneos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo torneo
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<AdminContentSkeleton rows={6} />}>
        <ClubAdminTorneosContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminTorneosContent() {
  const { selectedClubId, tournaments } = await getClubTournamentsInitialData()

  return <ClubAdminTorneos showHeader={false} initialClubId={selectedClubId} initialTournaments={tournaments} />
}
