import { Suspense } from "react"
import type { Metadata } from "next"

import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubNewsInitialData } from "@/lib/club-admin/initial-data"
import { ClubAdminNewButton } from "../components/club-admin-new-button"
import { NoticiasContent } from "./noticias-content"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Noticias del club" }

export default function ClubAdminNoticiasPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Noticias" action={<ClubAdminNewButton path="/noticias/nueva" label="Nueva noticia" />} />

      <Suspense fallback={<AdminContentSkeleton rows={6} />}>
        <ClubAdminNoticiasContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminNoticiasContent() {
  const { selectedClubId, news } = await getClubNewsInitialData()

  return <NoticiasContent initialNews={news} initialClubId={selectedClubId} />
}
