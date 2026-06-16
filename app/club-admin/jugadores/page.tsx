import { ClubPlayersManagement } from "./players-client"
import { getClubPlayersInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default async function ClubPlayersManagementPage() {
  const { players } = await getClubPlayersInitialData()

  return <ClubPlayersManagement initialPlayers={players} />
}
