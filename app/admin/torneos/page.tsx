"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, Users, Loader2, AlertCircle } from "lucide-react"

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
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tournament type based on the API response format
interface Tournament {
  id: string
  title: string
  description?: string | null
  time?: string | null
  place?: string | null
  location?: string | null
  rounds?: number | null
  pace?: string | null
  inscription_details?: string | null
  cost?: string | null
  prizes?: string | null
  image?: string | null
  start_date: Date
  end_date: Date | null
  formatted_start_date: string
  formatted_end_date?: string | null
  is_upcoming: boolean
  is_ongoing: boolean
  is_past: boolean
  status: "upcoming" | "ongoing" | "past"
  participants?: number
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión autenticada')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  const url = `${baseUrl}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  return response.json()
}

export default function AdminTorneosPage() {
  const [torneos, setTorneos] = useState<Tournament[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [torneoToDelete, setTorneoToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<Tournament[]>([])
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Fetch tournaments from API
  const fetchTournaments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch tournaments with display format for better UI data
      const response = await apiCall('/api/tournaments?format=display&limit=100')
      
      // Transform API data to match our interface
      const transformedTournaments = response.map((tournament: any) => {
        // Determine status from API response or calculate it
        let status: "upcoming" | "ongoing" | "past" = "upcoming"
        
        if (tournament.is_past) {
          status = "past"
        } else if (tournament.is_ongoing) {
          status = "ongoing"
        } else if (tournament.is_upcoming) {
          status = "upcoming"
        } else {
          // Fallback: calculate status from dates
          const now = new Date()
          const startDate = new Date(tournament.start_date)
          const endDate = tournament.end_date ? new Date(tournament.end_date) : null
          
          if (endDate && endDate < now) {
            status = "past"
          } else if (startDate <= now && (!endDate || endDate >= now)) {
            status = "ongoing"
          } else {
            status = "upcoming"
          }
        }
        
        return {
          id: tournament.id.toString(),
          title: tournament.title || 'Sin título',
          description: tournament.description || '',
          time: tournament.time || '',
          place: tournament.place || '',
          location: tournament.location || 'Ubicación no especificada',
          rounds: tournament.rounds || 0,
          pace: tournament.pace || '',
          inscription_details: tournament.inscription_details || '',
          cost: tournament.cost || '',
          prizes: tournament.prizes || '',
          image: tournament.image || '',
          start_date: new Date(tournament.start_date),
          end_date: tournament.end_date ? new Date(tournament.end_date) : null,
          formatted_start_date: tournament.formatted_start_date || '',
          formatted_end_date: tournament.formatted_end_date || '',
          is_upcoming: tournament.is_upcoming || false,
          is_ongoing: tournament.is_ongoing || false,
          is_past: tournament.is_past || false,
          status,
          participants: tournament.participants || 0
        }
      })
      
      setTorneos(transformedTournaments)
      setOriginalOrder(transformedTournaments)
    } catch (err) {
      console.error('Error fetching tournaments:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los torneos')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch tournaments when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchTournaments()
    }
  }, [isAuthenticated, authLoading])

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
          aValue = new Date(a.start_date).getTime()
          bValue = new Date(b.start_date).getTime()
          break
        case 'location':
          aValue = (a.location || '').toLowerCase()
          bValue = (b.location || '').toLowerCase()
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

  // Filtrar torneos según término de búsqueda
  const filteredTorneos = torneos.filter(
    (torneo) =>
      torneo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (torneo.location && torneo.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (torneo.description && torneo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      torneo.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Apply sorting to filtered tournaments
  const sortedAndFilteredTorneos = getSortedTorneos(filteredTorneos)

  // Función para eliminar un torneo
  const handleDeleteTorneo = async () => {
    if (!torneoToDelete) return

    try {
      setIsDeleting(true)
      setError(null)
      
      await apiCall(`/api/tournaments/${torneoToDelete}`, {
        method: 'DELETE'
      })
      
      setTorneos(torneos.filter((torneo) => torneo.id !== torneoToDelete))
      setShowDeleteDialog(false)
      setTorneoToDelete(null)
    } catch (err) {
      console.error('Error deleting tournament:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar el torneo')
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no especificada'
    try {
      return new Date(dateString).toLocaleDateString('es-AR')
    } catch {
      return 'Fecha inválida'
    }
  }

  // Get date range display
  const getDateRange = (startDate: Date | string, endDate: Date | string | null) => {
    const formattedStart = typeof startDate === 'string' ? startDate : formatDate(startDate.toString())
    const formattedEnd = endDate ? (typeof endDate === 'string' ? endDate : formatDate(endDate.toString())) : null
    
    if (!formattedEnd || formattedStart === formattedEnd) {
      return formattedStart
    }
    return `${formattedStart} al ${formattedEnd}`
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "upcoming":
        return "default"
      case "ongoing":
        return "default"
      case "past":
        return "outline"
      default:
        return "outline"
    }
  }

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 hover:bg-blue-500/80"
      case "ongoing":
        return "bg-green-500 hover:bg-green-500/80"
      case "past":
        return "text-muted-foreground"
      default:
        return ""
    }
  }

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Próximo"
      case "ongoing":
        return "En curso"
      case "past":
        return "Finalizado"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debes estar autenticado para acceder a esta página.
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
          <p className="text-muted-foreground">Gestiona los torneos y competiciones de FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/torneos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
              <DropdownMenuItem onClick={() => setSearchTerm("upcoming")}>Próximos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchTerm("ongoing")}>En curso</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchTerm("past")}>Finalizados</DropdownMenuItem>
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
                    Fecha
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
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Cargando torneos...</p>
                  </TableCell>
                </TableRow>
              ) : sortedAndFilteredTorneos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda.' : 'No hay torneos disponibles.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredTorneos.map((torneo) => (
                  <TableRow key={torneo.id}>
                    <TableCell className="font-medium">{torneo.title}</TableCell>
                    <TableCell>
                      {getDateRange(torneo.start_date, torneo.end_date)}
                    </TableCell>
                    <TableCell>{torneo.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(torneo.status)}
                        className={getStatusBadgeClass(torneo.status)}
                      >
                        {getStatusText(torneo.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{torneo.participants || 0}</TableCell>
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
                            <Link href={`/admin/torneos/${torneo.id}/editar`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/torneos/${torneo.id}/inscripciones`}>
                              <Users className="mr-2 h-4 w-4" />
                              Ver inscripciones
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setTorneoToDelete(torneo.id)
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
                ))
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
                {searchTerm ? 'No se encontraron torneos que coincidan con la búsqueda.' : 'No hay torneos disponibles.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAndFilteredTorneos.map((torneo) => (
                <div key={torneo.id} className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-5 text-card-foreground mb-2 line-clamp-2">
                        {torneo.title}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-terracotta">
                            {getDateRange(torneo.start_date, torneo.end_date)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{torneo.location}</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={getStatusBadgeVariant(torneo.status)}
                            className={`text-xs ${getStatusBadgeClass(torneo.status)}`}
                          >
                            {getStatusText(torneo.status)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{torneo.participants || 0}</span>
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
                          <Link href={`/admin/torneos/${torneo.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/torneos/${torneo.id}/inscripciones`}>
                            <Users className="mr-2 h-4 w-4" />
                            Ver inscripciones
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setTorneoToDelete(torneo.id)
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
              ))}
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

