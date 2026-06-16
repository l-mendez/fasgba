import { NuevoArbitroClient } from "@/app/admin/arbitros/nuevo/nuevo-arbitro-client"
import { getAdminClubOptions } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function NuevoArbitroPage() {
  const clubs = await getAdminClubOptions()

  return <NuevoArbitroClient initialClubs={clubs} />
}
