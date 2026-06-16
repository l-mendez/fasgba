import { Suspense } from "react"

import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubNewsInitialData } from "@/lib/club-admin/initial-data"
import { NewNewsButton } from "../components/new-news-button"
import { NoticiasContent } from "./noticias-content"

export const dynamic = "force-dynamic"

export default function ClubAdminNoticiasPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <AdminPageHeader
        title="Noticias"
        subtitle="Gestiona las noticias publicadas por tu club."
        action={<NewNewsButton />}
      />

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
