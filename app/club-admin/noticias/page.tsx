import { Suspense } from "react"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getClubNewsInitialData } from "@/lib/club-admin/initial-data"
import { NewNewsButton } from "../components/new-news-button"
import { NoticiasContent } from "./noticias-content"

export const dynamic = "force-dynamic"

export default async function ClubAdminNoticiasPage() {
  const { selectedClubId, news } = await getClubNewsInitialData()

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Noticias</h1>
          <p className="text-muted-foreground">
            Gestiona las noticias publicadas por tu club.
          </p>
        </div>
        <NewNewsButton />
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <NoticiasContent initialNews={news} initialClubId={selectedClubId} />
      </Suspense>
    </div>
  )
}
