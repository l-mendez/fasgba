"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, Users, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useClubContext } from "../context/club-context"

// Tournament type based on the API response
interface Tournament {
  id: number
  title: string
  description?: string
  time?: string
  place?: string
  location?: string
  rounds?: number
  pace?: string
  inscription_details?: string
  cost?: string
  prizes?: string
  image?: string
  created_by_club_id: number
  tournament_dates: {
    id: number
    tournament_id: number
    event_date: string
  }[]
}

// Helper function to determine tournament status
function getTournamentStatus(tournament: Tournament): "próximo" | "finalizado" | "en_curso" {
  const today = new Date().toISOString().split('T')[0]
  const dates = tournament.tournament_dates.map(d => d.event_date).sort()
  
  if (dates.length === 0) return "finalizado"
  
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]
  
  if (startDate > today) return "próximo"
  if (endDate < today) return "finalizado"
  return "en_curso"
}

// Helper function to format dates
function formatTournamentDates(tournament: Tournament): string {
  const dates = tournament.tournament_dates.map(d => d.event_date).sort()
  
  if (dates.length === 0) return "Sin fecha"
  
  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  
  if (dates.length === 1) {
    return formatDate(dates[0])
  }
  
  const startDate = formatDate(dates[0])
  const endDate = formatDate(dates[dates.length - 1])
  
  return `${startDate} al ${endDate}`
}

// API call helper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export default function ClubAdminTorneosPage() {
  const { selectedClub } = useClubContext()
  const [torneos, setTorneos] = useState<Tournament[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [tournamentToDelete, setTournamentToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tournaments when selected club changes
  useEffect(() => {
    async function loadTournaments() {
      if (!selectedClub) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const tournaments = await apiCall(`/clubs/${selectedClub.id}/tournaments`)
        setTorneos(tournaments.tournaments || [])
      } catch (err) {
        console.error('Error loading tournaments:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los torneos')
      } finally {
        setIsLoading(false)
      }
    }

    loadTournaments()
  }, [selectedClub])

  // Filter tournaments by search term
  const filteredTorneos = torneos.filter((torneo) => {
    const searchLower = searchTerm.toLowerCase()
    const status = getTournamentStatus(torneo)
    
    return (
      torneo.title.toLowerCase().includes(searchLower) ||
      (torneo.place || "").toLowerCase().includes(searchLower) ||
      status.includes(searchLower)
    )
  })

  // Function to delete a tournament
  const handleDeleteTorneo = async () => {
    if (!tournamentToDelete) return

    try {
      await apiCall(`/tournaments/${tournamentToDelete}`, {
        method: 'DELETE'
      })
      
      // Update the local state by filtering out the deleted tournament
      setTorneos(torneos.filter((torneo) => torneo.id !== tournamentToDelete))
      
      setShowDeleteDialog(false)
      setTournamentToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el torneo')
      setShowDeleteDialog(false)
      setTournamentToDelete(null)
    }
  }

  if (!selectedClub) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin club seleccionado</AlertTitle>
          <AlertDescription>
            Selecciona un club en el menú lateral para gestionar sus torneos.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Torneos</h1>
          <p className="text-muted-foreground">
            Gestiona los torneos organizados por {selectedClub.name}.
          </p>
        </div>
        <Button asChild>
          <Link href="/club-admin/torneos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o lugar..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filtrar
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("próximo")}>Próximos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("en_curso")}>En curso</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("finalizado")}>Finalizados</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rondas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Cargando torneos...
                </TableCell>
              </TableRow>
            ) : filteredTorneos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda' : 'No hay torneos registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTorneos.map((torneo) => {
                const status = getTournamentStatus(torneo)
                const formattedDates = formatTournamentDates(torneo)
                
                return (
                  <TableRow key={torneo.id}>
                    <TableCell className="font-medium">{torneo.title}</TableCell>
                    <TableCell>{formattedDates}</TableCell>
                    <TableCell>{torneo.place || "Sin lugar definido"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === "finalizado" ? "outline" : "default"}
                        className={
                          status === "próximo" 
                            ? "bg-blue-500 hover:bg-blue-500/80" 
                            : status === "en_curso"
                            ? "bg-green-500 hover:bg-green-500/80"
                            : "text-muted-foreground"
                        }
                      >
                        {status === "próximo" ? "Próximo" : status === "en_curso" ? "En curso" : "Finalizado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{torneo.rounds || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/torneos/${torneo.id}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" />
                              Ver en sitio
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/club-admin/torneos/${torneo.id}/editar`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/club-admin/torneos/${torneo.id}/inscripciones`}>
                              <Users className="mr-2 h-4 w-4" />
                              Ver inscripciones
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setTournamentToDelete(torneo.id)
                              setShowDeleteDialog(true)
                            }}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación para eliminar torneo */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este torneo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTorneo}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

