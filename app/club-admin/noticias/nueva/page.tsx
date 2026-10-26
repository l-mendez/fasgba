import { redirect } from "next/navigation"

import { getClubAdminContext } from "@/lib/club-admin/initial-data"
import { clubAdminEditorHref } from "@/lib/club-admin/links"

export const dynamic = "force-dynamic"

export default async function RedirectToUnifiedNewNews() {
  const { selectedClub } = await getClubAdminContext()
  redirect(clubAdminEditorHref("/noticias/nueva", selectedClub.id))
}
