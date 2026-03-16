"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, Users, AlertCircle, Loader2 } from "lucide-react"

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
import { useClubContext, apiCall } from "../context/club-context"

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
  tournament_type: string
  participants: number
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

// Get date range for sorting (returns earliest date as Date object)
function getTournamentSortDate(tournament: Tournament): Date {
  const dates = tournament.tournament_dates.map(d => d.event_date).sort()
  if (dates.length === 0) return new Date(0) // Very old date for tournaments without dates
  return new Date(dates[0])
}

// Get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "próximo":
      return "default"
    case "en_curso":
      return "default"
    case "finalizado":
      return "outline"
    default:
      return "outline"
  }
}

// Get status badge class
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "próximo":
      return "bg-blue-500 hover:bg-blue-500/80"
    case "en_curso":
      return "bg-green-500 hover:bg-green-500/80"
    case "finalizado":
      return "text-muted-foreground"
    default:
      return ""
  }
}

// Get status display text
const getStatusText = (status: string) => {
  switch (status) {
    case "próximo":
      return "Próximo"
    case "en_curso":
      return "En curso"
    case "finalizado":
      return "Finalizado"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export default function ClubAdminTorneosPage() {
  const { selectedClub, isLoading: clubsLoading, hasNoClubs } = useClubContext()
  const [torneos, setTorneos] = useState<Tournament[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [tournamentToDelete, setTournamentToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<Tournament[]>([])

  // Check for unauthorized access once clubs are loaded
  useEffect(() => {
    if (!clubsLoading && hasNoClubs) {
      notFound()
    }
  }, [clubsLoading, hasNoClubs])

  // Load tournaments when selected club changes
  useEffect(() => {
    async function loadTournaments() {
      if (!selectedClub) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const tournaments = await apiCall(`/clubs/${selectedClub.id}/tournaments`)
        const tournamentList = tournaments.tournaments || []
        
        // Fetch participant counts for each tournament using direct database queries
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const tournamentsWithParticipants = await Promise.all(
          tournamentList.map(async (tournament: Tournament) => {
            let participants = 0
            try {
              if (tournament.tournament_type === 'team') {
                // For team tournaments, count registered teams
                const { data: registeredTeams, error: teamsError } = await supabase
                  .from('tournament_teams')
                  .select('team_id, teams(club_id)')
                  .eq('tournament_id', tournament.id)

                if (!teamsError && registeredTeams && registeredTeams.length > 0) {
                  const clubIds = [...new Set(registeredTeams.map((t: any) => t.teams?.club_id).filter(Boolean))]

                  const { data: clubPlayers, error: playersError } = await supabase
                    .from('players')
                    .select('id')
                    .in('club_id', clubIds)

                  if (!playersError && clubPlayers) {
                    participants = clubPlayers.length
                  }
                }
              } else {
                // For individual tournaments, count players registered through tournament_registrations
                const { data: individualPlayers, error: individualPlayersError } = await supabase
                  .from('tournament_registrations')
                  .select('player_id')
                  .eq('tournament_id', tournament.id)
                
                if (!individualPlayersError && individualPlayers) {
                  participants = individualPlayers.length
                }
              }
            } catch (error) {
              console.error(`Error fetching participants for tournament ${tournament.id}:`, error)
              // Keep participants as 0 if there's an error
            }
            
            return {
              ...tournament,
              participants
            }
          })
        )
        
        setTorneos(tournamentsWithParticipants)
        setOriginalOrder(tournamentsWithParticipants)
      } catch (err) {
        console.error('Error loading tournaments:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar los torneos')
      } finally {
        setIsLoading(false)
      }
    }

    loadTournaments()
  }, [selectedClub])

  // Sorting functions
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Cycle through: asc -> desc -> original
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder('original')
        setSortBy(null)
      }
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortedTorneos = (torneosToSort: Tournament[]) => {
    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(torneo => 
        torneosToSort.some(filtered => filtered.id === torneo.id)
      )
    }

    const sorted = [...torneosToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'date':
          aValue = getTournamentSortDate(a).getTime()
          bValue = getTournamentSortDate(b).getTime()
          break
        case 'location':
          aValue = (a.place || '').toLowerCase()
          bValue = (b.place || '').toLowerCase()
          break
        case 'rounds':
          aValue = a.rounds || 0
          bValue = b.rounds || 0
          break
        case 'participants':
          aValue = a.participants || 0
          bValue = b.participants || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return null
    }
    
    if (sortOrder === 'asc') {
      return '↑'
    } else if (sortOrder === 'desc') {
      return '↓'
    }
    
    return null
  }

  // Filter tournaments by search term
  const filteredTorneos = torneos.filter((torneo) => {
    const searchLower = searchTerm.toLowerCase()
    const status = getTournamentStatus(torneo)
    
    return (
      torneo.title.toLowerCase().includes(searchLower) ||
      (torneo.place || "").toLowerCase().includes(searchLower) ||
      (torneo.description || "").toLowerCase().includes(searchLower) ||
      status.includes(searchLower)
    )
  })

  // Apply sorting to filtered tournaments
  const sortedAndFilteredTorneos = getSortedTorneos(filteredTorneos)

  // Function to delete a tournament
  const handleDeleteTorneo = async () => {
    if (!tournamentToDelete) return

    try {
      setIsDeleting(true)
      setError(null)
      
      await apiCall(`/tournaments/${tournamentToDelete}`, {
        method: 'DELETE'
      })
      
      // Update the local state by filtering out the deleted tournament
      setTorneos(torneos.filter((torneo) => torneo.id !== tournamentToDelete))
      setOriginalOrder(originalOrder.filter((torneo) => torneo.id !== tournamentToDelete))
      
      setShowDeleteDialog(false)
      setTournamentToDelete(null)
    } catch (err) {
      console.error('Error deleting tournament:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar el torneo')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show loading while clubs are being loaded or if no club is selected yet
  if (clubsLoading || !selectedClub) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Cargando...</h3>
          <p className="text-muted-foreground">Cargando información del club...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Torneos</h1>
          <p className="text-muted-foreground">
            Gestiona los torneos organizados por {selectedClub.name}.
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/torneos/nuevo">
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, lugar o descripción..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Ordenar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort('name')}>
                Nombre {getSortIcon('name')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('date')}>
                Fecha {getSortIcon('date')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('location')}>
                Lugar {getSortIcon('location')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('rounds')}>
                Rondas {getSortIcon('rounds')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('participants')}>
                Participantes {getSortIcon('participants')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSortBy(null)
                setSortOrder('original')
              }}>
                Orden original
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <>
        {/* Desktop Table View - Hidden on mobile */}
        <div className="rounded-md border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    {getSortIcon('name') && <span className="text-xs">{getSortIcon('name')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Fechas
                    {getSortIcon('date') && <span className="text-xs">{getSortIcon('date')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-1">
                    Lugar
                    {getSortIcon('location') && <span className="text-xs">{getSortIcon('location')}</span>}
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('rounds')}
                >
                  <div className="flex items-center gap-1">
                    Rondas
                    {getSortIcon('rounds') && <span className="text-xs">{getSortIcon('rounds')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('participants')}
                >
                  <div className="flex items-center gap-1">
                    Participantes
                    {getSortIcon('participants') && <span className="text-xs">{getSortIcon('participants')}</span>}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Cargando torneos...</p>
                  </TableCell>
                </TableRow>
              ) : sortedAndFilteredTorneos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda.' : 'No hay torneos registrados.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredTorneos.map((torneo) => {
                  const status = getTournamentStatus(torneo)
                  const formattedDates = formatTournamentDates(torneo)
                  
                  return (
                    <TableRow key={torneo.id}>
                      <TableCell className="font-medium">{torneo.title}</TableCell>
                      <TableCell>{formattedDates}</TableCell>
                      <TableCell>{torneo.place || "Sin lugar definido"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(status)}
                          className={getStatusBadgeClass(status)}
                        >
                          {getStatusText(status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{torneo.rounds || "N/A"}</TableCell>
                      <TableCell>{torneo.participants || "N/A"}</TableCell>
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
                              <Link href={`/torneos/${torneo.id}/editar`}>
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

        {/* Mobile Card View - Hidden on desktop */}
        <div className="md:hidden pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Cargando torneos...</p>
            </div>
          ) : sortedAndFilteredTorneos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda.' : 'No hay torneos registrados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAndFilteredTorneos.map((torneo) => {
                const status = getTournamentStatus(torneo)
                const formattedDates = formatTournamentDates(torneo)
                
                return (
                  <div key={torneo.id} className="bg-card rounded-lg border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-5 text-card-foreground mb-2 line-clamp-2">
                          {torneo.title}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-terracotta">
                              {formattedDates}
                            </span>
                            <span>•</span>
                            <span className="truncate">{torneo.place || "Sin lugar definido"}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(status)}
                              className={`text-xs ${getStatusBadgeClass(status)}`}
                            >
                              {getStatusText(status)}
                            </Badge>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Rondas: {torneo.rounds || "N/A"}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{torneo.participants || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
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
                            <Link href={`/torneos/${torneo.id}/editar`}>
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>

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
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTorneo}
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

