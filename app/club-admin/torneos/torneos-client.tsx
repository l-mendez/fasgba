"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowUpDown,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  Eye,
  ListOrdered,
  Loader2,
  Pencil,
  PlayCircle,
  Search,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions, type AdminRowAction } from "@/components/admin-row-actions"
import { AdminSortIcon } from "@/components/admin-sort-icon"
import { InfoPill } from "@/components/info-pill"
import { ErrorAlert } from "@/components/error-alert"
import { useClubContext } from "../context/club-context"
import { apiCall } from "@/lib/utils/apiClient"
import { getArgentinaDateInputValue } from "@/lib/dateUtils"
import { compareBy } from "@/lib/sortUtils"
import { clubAdminEditorHref } from "@/lib/club-admin/links"

interface Tournament {
  id: number
  title: string
  description?: string
  place?: string
  rounds?: number
  created_by_club_id: number
  tournament_dates: {
    id: number
    tournament_id: number
    event_date: string
  }[]
  tournament_type: string
  participants: number
}

type Status = "upcoming" | "ongoing" | "past" | "undated"
type SortField = "name" | "date" | "location" | "rounds" | "participants"

const STATUS: Record<Status, { label: string; icon: LucideIcon }> = {
  upcoming: { label: "Próximo", icon: CalendarClock },
  ongoing: { label: "En curso", icon: PlayCircle },
  past: { label: "Finalizado", icon: CheckCircle2 },
  undated: { label: "Sin fecha", icon: CalendarOff },
}

const SORT_LABELS: Record<SortField, string> = {
  name: "Nombre",
  date: "Fechas",
  location: "Lugar",
  rounds: "Rondas",
  participants: "Participantes",
}

function getSortedDates(tournament: Tournament) {
  return tournament.tournament_dates.map((d) => d.event_date).sort()
}

// "Today" is the Argentina calendar date, not UTC.
function getTournamentStatus(tournament: Tournament, today: string): Status {
  const dates = getSortedDates(tournament)
  if (dates.length === 0) return "undated"
  if (dates[0] > today) return "upcoming"
  if (dates[dates.length - 1] < today) return "past"
  return "ongoing"
}

function formatTournamentDates(tournament: Tournament): string {
  const dates = getSortedDates(tournament)
  if (dates.length === 0) return "Sin fecha"

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`
  }

  if (dates.length === 1) return formatDate(dates[0])
  return `${formatDate(dates[0])} al ${formatDate(dates[dates.length - 1])}`
}

function getSortValue(tournament: Tournament, field: SortField): string | number {
  switch (field) {
    case "name":
      return tournament.title.toLowerCase()
    case "date":
      return getSortedDates(tournament)[0] || ""
    case "location":
      return (tournament.place || "").toLowerCase()
    case "rounds":
      return tournament.rounds || 0
    case "participants":
      return tournament.participants || 0
  }
}

interface ClubAdminTorneosProps {
  initialClubId: number
  initialTournaments: Tournament[]
}

export function ClubAdminTorneos({ initialClubId, initialTournaments }: ClubAdminTorneosProps) {
  const { selectedClub } = useClubContext()
  const [torneos, setTorneos] = useState<Tournament[]>(initialTournaments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all")
  const [tournamentToDelete, setTournamentToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentClubId, setCurrentClubId] = useState(initialClubId)

  useEffect(() => {
    async function loadTournaments() {
      if (!selectedClub || selectedClub.id === currentClubId) return

      try {
        setIsLoading(true)
        setError(null)
        const data = await apiCall(`/api/clubs/${selectedClub.id}/tournaments`)
        setTorneos(data.tournaments || [])
        setCurrentClubId(selectedClub.id)
      } catch (err) {
        console.error("Error loading tournaments:", err)
        setError(err instanceof Error ? err.message : "Error al cargar los torneos")
      } finally {
        setIsLoading(false)
      }
    }

    loadTournaments()
  }, [selectedClub?.id])

  // Cycle: asc -> desc -> original order
  const handleSort = (field: SortField) => {
    if (sortBy !== field) {
      setSortBy(field)
      setSortOrder("asc")
    } else if (sortOrder === "asc") {
      setSortOrder("desc")
    } else {
      setSortBy(null)
    }
  }

  const sortIcon = (field: SortField) => <AdminSortIcon direction={sortBy === field ? sortOrder : null} />

  const today = getArgentinaDateInputValue()
  const searchLower = searchTerm.toLowerCase()
  const filteredTorneos = torneos.filter((torneo) => {
    if (statusFilter !== "all" && getTournamentStatus(torneo, today) !== statusFilter) return false
    return (
      torneo.title.toLowerCase().includes(searchLower) ||
      (torneo.place || "").toLowerCase().includes(searchLower) ||
      (torneo.description || "").toLowerCase().includes(searchLower)
    )
  })
  const visibleTorneos = sortBy
    ? [...filteredTorneos].sort(compareBy((torneo) => getSortValue(torneo, sortBy), sortOrder))
    : filteredTorneos
  const isFiltered = Boolean(searchTerm) || statusFilter !== "all"

  const handleDeleteTorneo = async () => {
    if (!tournamentToDelete) return

    try {
      setIsDeleting(true)
      setError(null)
      await apiCall(`/api/tournaments/${tournamentToDelete}`, { method: "DELETE" })
      setTorneos((current) => current.filter((torneo) => torneo.id !== tournamentToDelete))
    } catch (err) {
      console.error("Error deleting tournament:", err)
      setError(err instanceof Error ? err.message : "Error al eliminar el torneo")
    } finally {
      setIsDeleting(false)
      setTournamentToDelete(null)
    }
  }

  const editHref = (torneo: Tournament) => clubAdminEditorHref(`/torneos/${torneo.id}/editar`)

  const rowActions = (torneo: Tournament): AdminRowAction[] => [
    { label: "Ver en sitio", icon: Eye, href: `/torneos/${torneo.id}`, external: true },
    { label: "Editar", icon: Pencil, href: editHref(torneo) },
    { label: "Eliminar", icon: Trash2, destructive: true, onSelect: () => setTournamentToDelete(torneo.id) },
  ]

  if (!selectedClub) {
    return <p className="text-center text-muted-foreground">Selecciona un club.</p>
  }

  const emptyMessage = isFiltered ? "Sin resultados." : "No hay torneos."

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, lugar o descripción..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | "all")}>
            <SelectTrigger className="w-full md:w-[180px]" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {(Object.keys(STATUS) as Status[]).map((status) => (
                <SelectItem key={status} value={status}>{STATUS[status].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Desktop sorts from the column headers */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden" aria-label="Ordenar" title="Ordenar">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <DropdownMenuItem key={field} onSelect={() => handleSort(field)} className="justify-between gap-4">
                  {SORT_LABELS[field]}
                  {sortIcon(field)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <TableHead
                  key={field}
                  className={`cursor-pointer select-none hover:bg-muted/50 ${["location", "rounds", "participants"].includes(field) ? "hidden lg:table-cell" : ""}`}
                  onClick={() => handleSort(field)}
                  aria-sort={sortBy === field ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                >
                  <div className="flex items-center gap-1">
                    {SORT_LABELS[field]}
                    {sortIcon(field)}
                  </div>
                </TableHead>
              ))}
              <TableHead>Estado</TableHead>
              <TableHead className="w-[60px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : visibleTorneos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleTorneos.map((torneo) => {
                const status = STATUS[getTournamentStatus(torneo, today)]
                return (
                  <TableRow key={torneo.id}>
                    <TableCell className="font-medium">
                      <Link href={editHref(torneo)} className="hover:underline">{torneo.title}</Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatTournamentDates(torneo)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{torneo.place || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{torneo.rounds || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{torneo.participants || "-"}</TableCell>
                    <TableCell>
                      <InfoPill icon={status.icon}>{status.label}</InfoPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminRowActions actions={rowActions(torneo)} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleTorneos.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {visibleTorneos.map((torneo) => {
              const status = STATUS[getTournamentStatus(torneo, today)]
              return (
                <div key={torneo.id} className="relative rounded-lg border bg-card p-4 hover:border-amber">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Link
                        href={editHref(torneo)}
                        className="line-clamp-2 text-sm font-medium leading-5 after:absolute after:inset-0"
                      >
                        {torneo.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-terracotta">{formatTournamentDates(torneo)}</span>
                        {torneo.place ? (
                          <>
                            <span>•</span>
                            <span className="truncate">{torneo.place}</span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <InfoPill icon={status.icon}>{status.label}</InfoPill>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {torneo.rounds ? (
                            <span className="flex items-center gap-1">
                              <ListOrdered className="h-3 w-3" />
                              {torneo.rounds}
                            </span>
                          ) : null}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {torneo.participants || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <AdminRowActions actions={rowActions(torneo)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={tournamentToDelete !== null}
        onOpenChange={(open) => !open && setTournamentToDelete(null)}
        title="¿Eliminar torneo?"
        onConfirm={handleDeleteTorneo}
        pending={isDeleting}
      />
    </div>
  )
}
