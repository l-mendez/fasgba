import { ClubAdminEquipos } from "./equipos-client"
import { getClubTeamsInitialData } from "@/lib/club-admin/initial-data"

export const dynamic = "force-dynamic"

export default async function ClubAdminEquiposPage() {
  const { selectedClubId, teams } = await getClubTeamsInitialData()

  return <ClubAdminEquipos initialClubId={selectedClubId} initialTeams={teams} />
}
