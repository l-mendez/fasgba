import { ClubAdminTorneos } from "./torneos-client"
import { getClubTournamentsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default async function ClubAdminTorneosPage() {
  const { selectedClubId, tournaments } = await getClubTournamentsInitialData()

  return <ClubAdminTorneos initialClubId={selectedClubId} initialTournaments={tournaments} />
}
