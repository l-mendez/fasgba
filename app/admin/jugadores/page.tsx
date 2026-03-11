"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Users, Home, GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function PlayersManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [alumnoDialog, setAlumnoDialog] = useState<{ open: boolean; player: Player | null; results: any[]; loading: boolean; adding: boolean }>({
    open: false, player: null, results: [], loading: false, adding: false,
  })

  // Fetch data
  const fetchPlayers = async () => {
    try {
      const data = await apiCall('/api/players')
      setPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching players:', error)
      toast.error('Error al cargar jugadores')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchPlayers()
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Filter players based on search term
  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.fide_id && player.fide_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.club?.name && player.club.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

  const openAlumnoDialog = async (player: Player) => {
    setAlumnoDialog({ open: true, player, results: [], loading: true, adding: false })
    try {
      const data = await apiCall(`/api/admin/users/search?q=${encodeURIComponent(player.full_name)}`)
      const users = data.data?.users || data.users || []
      setAlumnoDialog((prev) => ({ ...prev, results: users, loading: false }))
    } catch {
      toast.error('Error buscando usuarios')
      setAlumnoDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleAddAlumno = async (authId: string) => {
    setAlumnoDialog((prev) => ({ ...prev, adding: true }))
    try {
      await apiCall('/api/admin/alumnos', {
        method: 'POST',
        body: JSON.stringify({ auth_id: authId }),
      })
      toast.success('Alumno agregado correctamente')
      setAlumnoDialog({ open: false, player: null, results: [], loading: false, adding: false })
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar alumno')
      setAlumnoDialog((prev) => ({ ...prev, adding: false }))
    }
  }

  const openDeleteDialog = (player: Player) => {
    setPlayerToDelete(player)
    setIsDeleteDialogOpen(true)
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

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, FIDE ID o club..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
                  No se encontraron jugadores
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell>{player.fide_id || "-"}</TableCell>
                  <TableCell>{player.rating || "-"}</TableCell>
                  <TableCell>{player.club?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAlumnoDialog(player)}
                        title="Hacer alumno"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <GraduationCap className="h-4 w-4" />
                      </Button>
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

      {/* Hacer Alumno Dialog */}
      <AlertDialog open={alumnoDialog.open} onOpenChange={(open) => !open && setAlumnoDialog({ open: false, player: null, results: [], loading: false, adding: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hacer alumno: {alumnoDialog.player?.full_name}</AlertDialogTitle>
            <AlertDialogDescription>
              Seleccioná la cuenta de usuario para agregar como alumno de la escuela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {alumnoDialog.loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
            </div>
          ) : alumnoDialog.results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No se encontró una cuenta de usuario para este jugador.
            </p>
          ) : (
            <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
              {alumnoDialog.results.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{u.user_metadata?.nombre} {u.user_metadata?.apellido}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email}
                      {u.club_name && <span className="ml-2 text-terracotta">({u.club_name})</span>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddAlumno(u.id)}
                    disabled={alumnoDialog.adding}
                    className="bg-terracotta hover:bg-terracotta/90"
                  >
                    {alumnoDialog.adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 