"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useClubContext } from "../context/club-context"
import { DashboardOverview } from "./dashboard-overview"
import { apiCall } from "@/lib/utils/apiClient"
import type { ClubAdminActivityItem, ClubAdminStats } from "@/lib/club-admin/types"

interface DashboardContentProps {
  initialClubId: number
  initialOverview: ReactNode
  initialStats: ClubAdminStats
  initialRecentActivity: ClubAdminActivityItem[]
  showHeader?: boolean
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
  showHeader = true,
}: DashboardContentProps) {
  const { selectedClub } = useClubContext()
  const [statsByClub, setStatsByClub] = useState<Record<number, ClubAdminStats>>({
    [initialClubId]: initialStats,
  })
  const [activityByClub, setActivityByClub] = useState<Record<number, ClubAdminActivityItem[]>>({
    [initialClubId]: initialRecentActivity,
  })
  const [stats, setStats] = useState<ClubAdminStats>(initialStats)
  const [recentActivity, setRecentActivity] = useState<ClubAdminActivityItem[]>(initialRecentActivity)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch club statistics
  const fetchClubStats = async (clubId: number) => {
    if (statsByClub[clubId]) {
      setStats(statsByClub[clubId])
      setRecentActivity(activityByClub[clubId] || [])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const data = await apiCall(`/api/clubs/${clubId}/stats`)
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
      setStatsByClub((current) => ({ ...current, [clubId]: data.stats }))
      setActivityByClub((current) => ({ ...current, [clubId]: data.recentActivity }))
    } catch (err) {
      console.error('Error fetching club stats:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      setStats(emptyStats)
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load stats when selected club changes
  useEffect(() => {
    if (selectedClub) {
      fetchClubStats(selectedClub.id)
    }
  }, [selectedClub?.id])

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecciona un club para ver el dashboard</p>
        </div>
      </div>
    )
  }

  const canUseInitialOverview =
    selectedClub.id === initialClubId && !isLoading && !error

  return (
    <div className="flex-1 space-y-4">
      {showHeader ? (
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard del Club</h2>
            <p className="text-muted-foreground">{selectedClub.name}</p>
          </div>
        </div>
      ) : null}

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
