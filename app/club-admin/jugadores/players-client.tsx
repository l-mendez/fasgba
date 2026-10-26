"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Search, Users, Home, Building2, Loader2 } from "lucide-react"
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
import { useClubContext } from "../context/club-context"
import Link from "next/link"

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

interface ClubPlayersManagementProps {
  initialPlayers: Player[]
  showHeader?: boolean
  showStats?: boolean
}

export function ClubPlayersManagement({ initialPlayers, showHeader = true, showStats = true }: ClubPlayersManagementProps) {
  const { clubesAdministrados } = useClubContext()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredPlayers = useMemo(() => {
    let filtered = players

    if (selectedClubFilter === "none") {
      filtered = filtered.filter(player => !player.club)
    } else if (selectedClubFilter !== "all") {
      const clubId = parseInt(selectedClubFilter)
      filtered = filtered.filter(player => player.club?.id === clubId)
    }

    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.fide_id && player.fide_id.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return filtered
  }, [players, searchTerm, selectedClubFilter])

  const handleDelete = async () => {
    if (!playerToDelete) return

    try {
      setIsDeleting(true)
      await apiCall(`/api/players/${playerToDelete.id}`, {
        method: 'DELETE',
      })
      toast.success('Jugador eliminado exitosamente')
      setIsDeleteDialogOpen(false)
      setPlayerToDelete(null)
      setPlayers((current) => current.filter((player) => player.id !== playerToDelete.id))
    } catch (error: unknown) {
      console.error('Error deleting player:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar jugador'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (player: Player) => {
    setPlayerToDelete(player)
    setIsDeleteDialogOpen(true)
  }

  if (clubesAdministrados.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No administras ningún club.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-terracotta">Jugadores</h1>
          </div>
          <Button asChild>
            <Link href="/jugadores/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo jugador
            </Link>
          </Button>
        </div>
      ) : null}

      {showStats ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jugadores</CardTitle>
              <Users className="h-4 w-4 text-amber" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con FIDE ID</CardTitle>
              <Users className="h-4 w-4 text-amber" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {players.filter(p => p.fide_id).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con club</CardTitle>
              <Home className="h-4 w-4 text-amber" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {players.filter(p => p.club).length}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o FIDE ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div>
          <Select value={selectedClubFilter} onValueChange={setSelectedClubFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por club" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clubes</SelectItem>
              <SelectItem value="none">Sin club</SelectItem>
              {clubesAdministrados.map((club) => (
                <SelectItem key={club.id} value={club.id.toString()}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Players Table */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">FIDE ID</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden md:table-cell">Club</TableHead>
              <TableHead className="w-[88px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedClubFilter !== "all" 
                    ? "No se encontraron jugadores con los filtros aplicados"
                    : "No hay jugadores registrados"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{player.fide_id || "-"}</TableCell>
                  <TableCell>{player.rating || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">{player.club?.name || "Sin club"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/jugadores/${player.id}/editar`} aria-label="Editar" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(player)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Eliminar"
                        title="Eliminar"
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
