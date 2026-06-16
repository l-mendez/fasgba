import { AdminRankingClient } from "@/app/admin/ranking/ranking-client"
import { getAdminRankingInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function AdminRankingPage() {
  const { rankings } = await getAdminRankingInitialData()

  return <AdminRankingClient initialPastRankings={rankings} />
}
