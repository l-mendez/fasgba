import { Suspense } from "react"

import { PastRankingsInfiniteTable } from "@/app/admin/ranking/past-rankings-infinite-table"
import { PastRankingsSection } from "@/app/admin/ranking/past-rankings-section"
import { RankingUploadSection } from "@/app/admin/ranking/ranking-upload-section"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminRankingInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminRankingPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Ranking" />
      <Suspense fallback={<AdminContentSkeleton filters={false} rows={6} />}>
        <AdminRankingContent />
      </Suspense>
    </div>
  )
}

async function AdminRankingContent() {
  const { existingRankingNames, ...initialData } = await getAdminRankingInitialData()

  return (
    <div className="space-y-6">
      <RankingUploadSection existingRankingNames={existingRankingNames} />
      <PastRankingsSection>
        <PastRankingsInfiniteTable
          key={`${initialData.total}-${initialData.rankings[0]?.id || "empty"}-${initialData.page}`}
          initialData={initialData}
        />
      </PastRankingsSection>
    </div>
  )
}
