import { NuevoProfesorClient } from "@/app/admin/profesores/nuevo/nuevo-profesor-client"
import { getAdminClubOptions } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function NuevoProfesorPage() {
  const clubs = await getAdminClubOptions()

  return <NuevoProfesorClient initialClubs={clubs} />
}
