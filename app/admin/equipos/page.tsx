import { AdminEquiposClient } from "@/app/admin/equipos/equipos-client"
import { getAdminEquiposInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function AdminEquiposPage() {
  const { clubs, teamsByClub } = await getAdminEquiposInitialData()

  return (
    <AdminEquiposClient
      initialClubs={clubs}
      initialTeamsByClub={teamsByClub}
    />
  )
}
