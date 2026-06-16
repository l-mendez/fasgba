import { Suspense } from "react"

import { DashboardContent } from "./components/dashboard-content"
import { DashboardOverview } from "./components/dashboard-overview"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubDashboardInitialData } from "@/lib/club-admin/initial-data"

export default function ClubAdminDashboard() {
  return (
    <div className="space-y-6 p-4 pt-6 md:p-8">
      <AdminPageHeader
        title="Dashboard del Club"
        subtitle="Resumen del club seleccionado."
      />
      <Suspense fallback={<AdminContentSkeleton stats={3} rows={3} filters={false} />}>
        <ClubAdminDashboardContent />
      </Suspense>
    </div>
  )
}

async function ClubAdminDashboardContent() {
  const { selectedClub, selectedClubId, stats, recentActivity } = await getClubDashboardInitialData()

  return (
    <DashboardContent
      initialOverview={
        <DashboardOverview
          recentActivity={recentActivity}
          selectedClub={selectedClub}
          stats={stats}
        />
      }
      showHeader={false}
      initialClubId={selectedClubId}
      initialStats={stats}
      initialRecentActivity={recentActivity}
    />
  )
}

// Keep dynamic rendering for authentication
export const dynamic = 'force-dynamic'
