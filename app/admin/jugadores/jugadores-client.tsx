"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions } from "@/components/admin-row-actions"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { apiCall } from "@/lib/utils/apiClient"

const PAGE_SIZE = 50

interface Player {
  id: number
  full_name: string
  fide_id: string | null
  rating: number | null
  club: {
    id: number
    name: string
  } | null
}

interface Club {
  id: number
  name: string
}

interface PlayersManagementClientProps {
  initialPlayers: Player[]
  initialClubs: Club[]
  initialTotalResults: number
}

export function PlayersManagementClient({
  initialPlayers,
  initialClubs,
  initialTotalResults,
}: PlayersManagementClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [clubs] = useState<Club[]>(initialClubs)
  const [selectedClubId, setSelectedClubId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPlayers.length < initialTotalResults)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(initialTotalResults)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasUsedInitialDataRef = useRef(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch players (resets on search/filter change)
  const fetchPlayers = useCallback(async (pageNum: number, search: string, clubId: string, append: boolean) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) })
      if (search) params.set('search', search)
      if (clubId) params.set('club_id', clubId)

      const data = await apiCall(`/api/players?${params}`)
      const fetched: Player[] = data.players || []

      setPlayers(prev => append ? [...prev, ...fetched] : fetched)
      setTotalResults(data.total || 0)
      setHasMore(pageNum < data.totalPages)
      setPage(pageNum)
    } catch {
      toast.error('Error al cargar jugadores')
    }
  }, [])

  // Reset and fetch when search or club filter changes
  useEffect(() => {
    if (!hasUsedInitialDataRef.current) {
      hasUsedInitialDataRef.current = true
      return
    }

    setIsLoading(true)
    setHasMore(true)
    fetchPlayers(1, debouncedSearch, selectedClubId, false).finally(() => setIsLoading(false))
  }, [debouncedSearch, selectedClubId, fetchPlayers])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setIsLoadingMore(true)
          fetchPlayers(page + 1, debouncedSearch, selectedClubId, true).finally(() => setIsLoadingMore(false))
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, debouncedSearch, selectedClubId, fetchPlayers])

  const handleDelete = async () => {
    if (!playerToDelete) return

    try {
      setIsDeleting(true)
      await apiCall(`/api/players/${playerToDelete.id}`, { method: 'DELETE' })
      toast.success('Jugador eliminado')
      setPlayerToDelete(null)
      // Refresh current data
      fetchPlayers(1, debouncedSearch, selectedClubId, false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar jugador')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, FIDE ID o club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedClubId} onValueChange={(v) => setSelectedClubId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los clubes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clubes</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(debouncedSearch || selectedClubId) && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>

      {/* Players Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-terracotta" aria-label="Cargando" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">FIDE ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Club</TableHead>
                  <TableHead className="w-[56px]"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No se encontraron jugadores
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{player.full_name}</span>
                          <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                            {[player.fide_id, player.rating, player.club?.name].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{player.fide_id || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{player.rating || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{player.club?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <AdminRowActions
                            actions={[
                              { label: "Editar", icon: Pencil, href: `/jugadores/${player.id}/editar` },
                              { label: "Eliminar", icon: Trash2, destructive: true, onSelect: () => setPlayerToDelete(player) },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-terracotta" aria-label="Cargando" />
              </div>
            )}

            {!hasMore && players.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
              </p>
            )}
          </>
        )}
      </div>

      <AdminConfirmDialog
        open={playerToDelete !== null}
        onOpenChange={(open) => !open && setPlayerToDelete(null)}
        title="¿Eliminar jugador?"
        description={
          <>
            Se eliminará <strong>{playerToDelete?.full_name}</strong>. Esta acción no se puede deshacer.
          </>
        }
        onConfirm={handleDelete}
        pending={isDeleting}
      />
    </div>
  )
}
