import { getClubAdminContext } from "@/lib/club-admin/initial-data"
import { NewNewsForm } from "./new-news-form"

export const dynamic = "force-dynamic"

export default async function NuevaNoticiaPage() {
  const { clubs, selectedClub } = await getClubAdminContext()

  return <NewNewsForm selectedClub={selectedClub} clubs={clubs} />
}
