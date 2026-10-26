import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { ClubPlayersManagement } from "./players-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { getClubPlayersInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Jugadores del club" }

export default function ClubPlayersManagementPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jugadores"
        action={
          <Button asChild>
            <Link href="/jugadores/nuevo?from=club-admin">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo jugador
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<AdminContentSkeleton />}>
        <ClubPlayersManagementContent />
      </Suspense>
    </div>
  )
}

async function ClubPlayersManagementContent() {
  const { selectedClubId, players, total } = await getClubPlayersInitialData()

  return (
    <ClubPlayersManagement
      initialClubId={selectedClubId}
      initialPlayers={players}
      initialTotal={total}
    />
  )
}
