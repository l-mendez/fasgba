"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Users, Home, Building2 } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { apiCall } from "@/lib/utils/apiClient"
import { useClubContext } from "../context/club-context"
import Link from "next/link"

export const dynamic = 'force-dynamic'

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

export default function ClubPlayersManagement() {
  const { selectedClub, clubesAdministrados } = useClubContext()
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch players for all administered clubs
  const fetchPlayers = async () => {
    try {
      const data = await apiCall('/api/players')
      const allPlayers = data.players || []
      
      // Filter players to only show those from clubs the user administers
      const adminClubIds = clubesAdministrados.map(club => club.id)
      const adminPlayers = allPlayers.filter((player: Player) => 
        !player.club || adminClubIds.includes(player.club.id)
      )
      
      setPlayers(adminPlayers)
    } catch (error) {
      console.error('Error fetching players:', error)
      toast.error('Error al cargar jugadores')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (clubesAdministrados.length === 0) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      await fetchPlayers()
      setIsLoading(false)
    }
    loadData()
  }, [clubesAdministrados])

  // Filter players based on search term and selected club
  useEffect(() => {
    let filtered = players

    // Filter by selected club
    if (selectedClubFilter === "none") {
      filtered = filtered.filter(player => !player.club)
    } else if (selectedClubFilter !== "all") {
      const clubId = parseInt(selectedClubFilter)
      filtered = filtered.filter(player => player.club?.id === clubId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.fide_id && player.fide_id.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredPlayers(filtered)
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
      fetchPlayers()
    } catch (error: any) {
      console.error('Error deleting player:', error)
      const errorMessage = error.message || 'Error al eliminar jugador'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin clubes administrados</h3>
          <p className="text-muted-foreground">
            No administras ningún club actualmente.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p>Cargando jugadores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Jugadores</h1>
          <p className="text-muted-foreground">
            Administra los jugadores de tus clubes
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
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con FIDE ID</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.fide_id).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Club</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.club).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o FIDE ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedClubFilter} onValueChange={setSelectedClubFilter}>
            <SelectTrigger className="w-[200px]">
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
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>FIDE ID</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
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
                  <TableCell>{player.fide_id || "-"}</TableCell>
                  <TableCell>{player.rating || "-"}</TableCell>
                  <TableCell>{player.club?.name || "Sin club"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/jugadores/${player.id}/editar`}>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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