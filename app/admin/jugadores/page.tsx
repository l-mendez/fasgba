import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { PlayersManagementClient } from "@/app/admin/jugadores/jugadores-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { AdminPlayerStats } from "@/components/admin-player-stats"
import { Button } from "@/components/ui/button"
import { getAdminJugadoresInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function PlayersManagementPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jugadores"
        action={
          <Button asChild>
            <Link href="/jugadores/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo jugador
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<AdminContentSkeleton stats={3} />}>
        <PlayersManagementContent />
      </Suspense>
    </div>
  )
}

async function PlayersManagementContent() {
  const { players, clubs, stats, totalResults } = await getAdminJugadoresInitialData()

  return (
    <div className="space-y-6">
      <AdminPlayerStats stats={stats} />
      <PlayersManagementClient
        initialPlayers={players}
        initialClubs={clubs}
        initialTotalResults={totalResults}
      />
    </div>
  )
}
