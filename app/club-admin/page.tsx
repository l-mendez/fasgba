import { Suspense } from "react"
import type { Metadata } from "next"

import { DashboardContent } from "./components/dashboard-content"
import { DashboardOverview } from "./components/dashboard-overview"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getClubDashboardInitialData } from "@/lib/club-admin/initial-data"

export const metadata: Metadata = { title: "Panel del club" }

export default function ClubAdminDashboard() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Panel" />
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
      initialClubId={selectedClubId}
      initialStats={stats}
      initialRecentActivity={recentActivity}
    />
  )
}

// Keep dynamic rendering for authentication
export const dynamic = 'force-dynamic'
