import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { ClubPlayersManagement } from "./players-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { AdminPlayerStats } from "@/components/admin-player-stats"
import { Button } from "@/components/ui/button"
import { getClubPlayersInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default function ClubPlayersManagementPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Jugadores"
        subtitle="Administra los jugadores de tus clubes."
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
        <ClubPlayersManagementContent />
      </Suspense>
    </div>
  )
}

async function ClubPlayersManagementContent() {
  const { players } = await getClubPlayersInitialData()
  const stats = {
    total: players.length,
    withFideId: players.filter((player) => player.fide_id).length,
    withClub: players.filter((player) => player.club).length,
  }

  return (
    <div className="space-y-6">
      <AdminPlayerStats stats={stats} />
      <ClubPlayersManagement showHeader={false} showStats={false} initialPlayers={players} />
    </div>
  )
}
