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
        title="Gestión de Jugadores"
        subtitle="Administra la información de todos los jugadores registrados"
        action={
          <Button asChild className="bg-terracotta hover:bg-terracotta/90">
            <Link href="/jugadores/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Jugador
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
        showHeader={false}
        showStats={false}
        initialPlayers={players}
        initialClubs={clubs}
        initialStats={stats}
        initialTotalResults={totalResults}
      />
    </div>
  )
}
