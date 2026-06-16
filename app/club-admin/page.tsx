import { DashboardContent } from "./components/dashboard-content"
import { getClubDashboardInitialData } from "@/lib/club-admin/initial-data"

export default async function ClubAdminDashboard() {
  const { selectedClubId, stats, recentActivity } = await getClubDashboardInitialData()

  return (
    <DashboardContent
      initialClubId={selectedClubId}
      initialStats={stats}
      initialRecentActivity={recentActivity}
    />
  )
}

// Keep dynamic rendering for authentication
export const dynamic = 'force-dynamic'
