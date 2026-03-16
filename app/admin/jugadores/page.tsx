"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, Users, Home, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { apiCall } from "@/lib/utils/apiClient"
import Link from "next/link"

export const dynamic = 'force-dynamic'

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

interface Stats {
  total: number
  withFideId: number
  withClub: number
}

export default function PlayersManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClubId, setSelectedClubId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch stats and clubs once on mount
  useEffect(() => {
    apiCall('/api/players?stats=true').then(setStats).catch(() => {})
    apiCall('/api/clubs').then(data => setClubs(data.clubs || [])).catch(() => {})
  }, [])

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
      toast.success('Jugador eliminado exitosamente')
      setIsDeleteDialogOpen(false)
      setPlayerToDelete(null)
      // Refresh current data
      fetchPlayers(1, debouncedSearch, selectedClubId, false)
      // Refresh stats
      apiCall('/api/players?stats=true').then(setStats).catch(() => {})
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar jugador')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (player: Player) => {
    setPlayerToDelete(player)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Jugadores</h1>
          <p className="text-muted-foreground">
            Administra la información de todos los jugadores registrados
          </p>
        </div>
        <Link href="/jugadores/nuevo">
          <Button className="bg-terracotta hover:bg-terracotta/90">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Jugador
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jugadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con FIDE ID</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.withFideId ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Club</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.withClub ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar por nombre, FIDE ID o club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
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
            {totalResults} resultado{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Players Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
            <span className="ml-2 text-muted-foreground">Cargando jugadores...</span>
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
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
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
                        <div className="flex items-center space-x-1">
                          <Link href={`/jugadores/${player.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(player)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                <Loader2 className="h-5 w-5 animate-spin text-terracotta" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando más...</span>
              </div>
            )}

            {!hasMore && players.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {players.length} jugador{players.length !== 1 ? 'es' : ''} mostrado{players.length !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el jugador{" "}
              <strong>{playerToDelete?.full_name}</strong> del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
