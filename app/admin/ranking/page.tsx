import { PastRankingsInfiniteTable } from "@/app/admin/ranking/past-rankings-infinite-table"
import { PastRankingsSection } from "@/app/admin/ranking/past-rankings-section"
import { RankingUploadSection } from "@/app/admin/ranking/ranking-upload-section"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminRankingInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function AdminRankingPage() {
  const { existingRankingNames, ...initialData } = await getAdminRankingInitialData()

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Ranking" />
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
