"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Pencil, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { ErrorAlert } from "@/components/error-alert"
import { listClubPlayersAction } from "@/lib/club-admin/actions"
import {
  CLUB_PLAYERS_PAGE_SIZE,
  type ClubAdminPlayer,
  type ClubPlayersScope,
} from "@/lib/club-admin/types"
import { useClubContext } from "../context/club-context"

interface ClubPlayersManagementProps {
  initialClubId: number
  initialPlayers: ClubAdminPlayer[]
  initialTotal: number
}

// Lists the selected club's players (or unaffiliated ones, which club admins
// may claim). Search and pagination run on the server.
export function ClubPlayersManagement({ initialClubId, initialPlayers, initialTotal }: ClubPlayersManagementProps) {
  const { selectedClub } = useClubContext()
  const [players, setPlayers] = useState(initialPlayers)
  const [total, setTotal] = useState(initialTotal)
  const [onlyUnaffiliated, setOnlyUnaffiliated] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadedKey = useRef(`${initialClubId}||1`)

  const clubId = selectedClub?.id ?? initialClubId
  const scope: ClubPlayersScope = onlyUnaffiliated ? "none" : clubId
  // The page belongs to a club/scope/search combination; changing any of them restarts at 1.
  const listKey = `${scope}|${search}`
  const [pageState, setPageState] = useState({ key: listKey, page: 1 })
  const page = pageState.key === listKey ? pageState.page : 1
  const setPage = (next: number) => setPageState({ key: listKey, page: next })

  // Debounce typing.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const key = `${listKey}|${page}`
    if (key === loadedKey.current) return
    let cancelled = false

    setIsLoading(true)
    setError(null)
    listClubPlayersAction({ scope, search, page })
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setError(result.error)
          return
        }
        loadedKey.current = key
        setPlayers(result.data.players)
        setTotal(result.data.total)
      })
      .catch(() => !cancelled && setError("Error al cargar jugadores"))
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [listKey, scope, search, page])

  const totalPages = Math.max(1, Math.ceil(total / CLUB_PLAYERS_PAGE_SIZE))

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o FIDE ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={onlyUnaffiliated ? "none" : "club"} onValueChange={(value) => setOnlyUnaffiliated(value === "none")}>
          <SelectTrigger className="w-full md:w-[220px]" aria-label="Club">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="club">{selectedClub?.name ?? "Mi club"}</SelectItem>
            <SelectItem value="none">Sin club</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">FIDE ID</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-[56px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {search ? "Sin resultados." : "No hay jugadores."}
                </TableCell>
              </TableRow>
            ) : (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <Link href={`/jugadores/${player.id}/editar?from=club-admin`} className="hover:underline">
                      {player.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{player.fide_id || "-"}</TableCell>
                  <TableCell>{player.rating || "-"}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link href={`/jugadores/${player.id}/editar?from=club-admin`} aria-label="Editar" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{total} {total === 1 ? "jugador" : "jugadores"}</span>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
              aria-label="Página anterior"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || isLoading}
              aria-label="Página siguiente"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
