"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Archive, Calendar, CheckCircle2, RefreshCw } from "lucide-react"

import { RankingRowActions } from "./ranking-row-actions"
import type { PaginatedPastRankings, PastRanking } from "./types"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiCall } from "@/lib/utils/apiClient"

interface PastRankingsInfiniteTableProps {
  initialData: PaginatedPastRankings
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function mergeRankings(current: PastRanking[], incoming: PastRanking[]) {
  const map = new Map(current.map((ranking) => [ranking.id, ranking]))

  incoming.forEach((ranking) => {
    map.set(ranking.id, ranking)
  })

  return Array.from(map.values())
}

export function PastRankingsInfiniteTable({ initialData }: PastRankingsInfiniteTableProps) {
  const [rankings, setRankings] = useState(initialData.rankings)
  const [hasMore, setHasMore] = useState(initialData.hasMore)
  const [nextPage, setNextPage] = useState(initialData.nextPage)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState("")
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const inFlightPageRef = useRef<number | null>(null)

  const loadMore = useCallback(async (pageToLoad: number) => {
    if (isLoadingMore || inFlightPageRef.current === pageToLoad) return

    inFlightPageRef.current = pageToLoad
    setIsLoadingMore(true)
    setLoadError("")

    try {
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        pageSize: initialData.pageSize.toString(),
      })
      const result = await apiCall(`/api/admin/ranking/list?${params.toString()}`) as PaginatedPastRankings

      setRankings((current) => mergeRankings(current, result.rankings))
      setHasMore(result.hasMore)
      setNextPage(result.nextPage)
    } catch (error) {
      console.error("Load rankings error:", error)
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar más rankings")
    } finally {
      inFlightPageRef.current = null
      setIsLoadingMore(false)
    }
  }, [initialData.pageSize, isLoadingMore])

  useEffect(() => {
    const node = sentinelRef.current

    if (!node || !hasMore || !nextPage || loadError) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore(nextPage)
        }
      },
      { rootMargin: "320px 0px" }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadError, loadMore, nextPage])

  if (rankings.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No hay rankings cargados</p>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>
            Mostrando {rankings.length} de {initialData.total}{" "}
            {initialData.total === 1 ? "ranking" : "rankings"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Jugadores</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((ranking) => (
              <TableRow key={ranking.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {ranking.displayName || ranking.name}
                    </div>
                    <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {ranking.name}
                    </code>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-amber" />
                    {formatDate(ranking.date)}
                  </div>
                </TableCell>
                <TableCell className="hidden text-right font-mono sm:table-cell">
                  {ranking.totalPlayers}
                </TableCell>
                <TableCell>
                  <InfoPill icon={ranking.status === "current" ? CheckCircle2 : Archive}>
                    {ranking.status === "current" ? "Actual" : "Archivado"}
                  </InfoPill>
                </TableCell>
                <TableCell className="text-right">
                  <RankingRowActions ranking={ranking} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore || loadError ? (
        <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-2">
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
          {nextPage ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadMore(nextPage)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : loadError ? (
                "Reintentar"
              ) : (
                "Cargar más"
              )}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
