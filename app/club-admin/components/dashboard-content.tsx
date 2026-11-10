"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useClubContext } from "../context/club-context"
import { DashboardOverview } from "./dashboard-overview"
import { apiCall } from "@/lib/utils/apiClient"
import type { ClubAdminActivityItem, ClubAdminStats, ClubStatsResponse } from "@/lib/club-admin/types"

interface DashboardContentProps {
  initialClubId: number
  initialOverview: ReactNode
  initialStats: ClubAdminStats
  initialRecentActivity: ClubAdminActivityItem[]
}

const emptyStats: ClubAdminStats = {
  noticias: 0,
  torneos: 0,
  torneosActivos: 0,
  seguidores: 0,
  crecimientoSeguidores: 0,
}

export function DashboardContent({
  initialClubId,
  initialOverview,
  initialStats,
  initialRecentActivity,
}: DashboardContentProps) {
  const { selectedClub } = useClubContext()
  const [statsByClub, setStatsByClub] = useState<Record<number, ClubAdminStats>>({
    [initialClubId]: initialStats,
  })
  const [activityByClub, setActivityByClub] = useState<Record<number, ClubAdminActivityItem[]>>({
    [initialClubId]: initialRecentActivity,
  })
  // Tagged with its club so a late failure for a club already left never
  // shows up on the current one.
  const [fetchError, setFetchError] = useState<{ clubId: number; message: string } | null>(null)
  const clubId = selectedClub?.id
  const isCached = clubId !== undefined && clubId in statsByClub

  // Switching clubs clears the error, so going back to a club whose load
  // failed shows the loading state again while it retries.
  const [prevClubId, setPrevClubId] = useState(clubId)
  if (clubId !== prevClubId) {
    setPrevClubId(clubId)
    setFetchError(null)
  }

  const error = fetchError && fetchError.clubId === clubId ? fetchError.message : null
  const isLoading = clubId !== undefined && !isCached && !error
  const stats = (clubId !== undefined && statsByClub[clubId]) || emptyStats
  const recentActivity = (clubId !== undefined && activityByClub[clubId]) || []

  // Load stats the first time a club is selected
  useEffect(() => {
    if (clubId === undefined || isCached) return

    apiCall<ClubStatsResponse>(`/api/clubs/${clubId}/stats`)
      .then((data) => {
        setStatsByClub((current) => ({ ...current, [clubId]: data.stats }))
        setActivityByClub((current) => ({ ...current, [clubId]: data.recentActivity }))
      })
      .catch((err) => {
        console.error('Error fetching club stats:', err)
        setFetchError({
          clubId,
          message: err instanceof Error ? err.message : 'Error al cargar estadísticas',
        })
      })
  }, [clubId, isCached])

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecciona un club.</p>
        </div>
      </div>
    )
  }

  const canUseInitialOverview =
    selectedClub.id === initialClubId && !isLoading && !error

  return (
    <div className="flex-1 space-y-4">
      {canUseInitialOverview ? initialOverview : (
        <DashboardOverview
          error={error}
          isLoading={isLoading}
          recentActivity={recentActivity}
          selectedClub={selectedClub}
          stats={stats}
        />
      )}
    </div>
  )
} 
