import { PlayersManagementClient } from "@/app/admin/jugadores/jugadores-client"
import { getAdminJugadoresInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function PlayersManagementPage() {
  const { players, clubs, stats, totalResults } = await getAdminJugadoresInitialData()

  return (
    <PlayersManagementClient
      initialPlayers={players}
      initialClubs={clubs}
      initialStats={stats}
      initialTotalResults={totalResults}
    />
  )
}
