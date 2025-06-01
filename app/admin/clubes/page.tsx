"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
// @ts-ignore - Bypassing lucide-react type issues temporarily
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, User } from "lucide-react"

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
import { supabase } from "@/lib/supabaseClient"

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  // Extended properties for display
  delegado?: string
  adminCount?: number
}

interface ClubAdmin {
  id: string
  email: string
}

// API utility functions
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

async function fetchClubs(): Promise<Club[]> {
  const clubs = await apiCall('/api/clubs?include=stats')
  
  // Fetch delegado information for each club (first admin)
  const clubsWithDelegados = await Promise.all(
    clubs.map(async (club: any) => {
      try {
        const admins = await apiCall(`/api/clubs/${club.id}/admins`)
        const delegado = admins.length > 0 ? admins[0].email : undefined
        return {
          ...club,
          delegado,
        }
      } catch (error) {
        console.error(`Error fetching admins for club ${club.id}:`, error)
        return {
          ...club,
          delegado: undefined,
        }
      }
    })
  )
  
  return clubsWithDelegados
}

async function deleteClub(clubId: number): Promise<void> {
  await apiCall(`/api/clubs/${clubId}`, {
    method: 'DELETE',
  })
}

async function getClubAdmins(clubId: number): Promise<ClubAdmin[]> {
  return apiCall(`/api/clubs/${clubId}/admins`)
}

async function addClubAdmin(clubId: number, email: string): Promise<void> {
  // For now, we'll just show an error message since we need a proper API endpoint
  // In a real implementation, this would call a dedicated API endpoint
  // that handles finding users by email and adding them as admins
  throw new Error('La funcionalidad de cambiar delegado requiere una API endpoint específica. Por favor contacta al administrador del sistema.')
}

export default function AdminClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [clubToDelete, setClubToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showChangeDelegadoDialog, setShowChangeDelegadoDialog] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [newDelegadoEmail, setNewDelegadoEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch clubs from API
  useEffect(() => {
    async function loadClubs() {
      try {
        setIsLoading(true)
        setError(null)
        const clubsData = await fetchClubs()
        setClubes(clubsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los clubes")
      } finally {
        setIsLoading(false)
      }
    }

    loadClubs()
  }, [])

  // Filter clubs by search term
  const filteredClubes = clubes.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.delegado?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  // Function to delete a club
  const handleDeleteClub = async () => {
    if (!clubToDelete) return

    try {
      await deleteClub(clubToDelete)
      
      // Update the local state by filtering out the deleted club
      setClubes(clubes.filter((club) => club.id !== clubToDelete))
      
      setShowDeleteDialog(false)
      setClubToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el club")
    }
  }

  // Function to show delegado functionality message
  const handleChangeDelegado = async () => {
    setError('La funcionalidad de cambiar delegado requiere configuración adicional en el backend.')
    setShowChangeDelegadoDialog(false)
    setSelectedClub(null)
    setNewDelegadoEmail("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 text-white hover:bg-red-700"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Clubes</h1>
          <p className="text-muted-foreground">Gestiona los clubes afiliados a FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/clubes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Club
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o delegado..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* @ts-ignore */}
            <Button variant="outline">
              Filtrar
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("@")}>Con delegado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Delegado</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Horarios</TableHead>
              <TableHead>Admins</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClubes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No se encontraron clubes
                </TableCell>
              </TableRow>
            ) : (
              filteredClubes.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell>
                    {club.delegado ? (
                      <span className="text-sm">{club.delegado}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin delegado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs">{club.mail || "Sin email"}</span>
                      <span className="text-xs text-muted-foreground">{club.telephone || "Sin teléfono"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{club.schedule || "Sin horarios"}</TableCell>
                  <TableCell>
                    {/* @ts-ignore */}
                    <Badge variant="outline">
                      {club.adminCount || 0} admin{(club.adminCount || 0) !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        {/* @ts-ignore */}
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/clubes/${club.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/clubes/${club.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClub(club)
                            setNewDelegadoEmail(club.delegado || "")
                            setShowChangeDelegadoDialog(true)
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Cambiar delegado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setClubToDelete(club.id)
                            setShowDeleteDialog(true)
                          }}
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

      {/* Dialog for deleting a club */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el club.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* @ts-ignore */}
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteClub}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for changing a club's delegate */}
      <Dialog open={showChangeDelegadoDialog} onOpenChange={setShowChangeDelegadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar delegado</DialogTitle>
            <DialogDescription>
              Esta funcionalidad está en desarrollo. Por favor contacta al administrador del sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="email"
              placeholder="Email del nuevo delegado"
              value={newDelegadoEmail}
              onChange={(e) => setNewDelegadoEmail(e.target.value)}
              disabled
            />
          </div>
          <DialogFooter>
            {/* @ts-ignore */}
            <Button variant="outline" onClick={() => setShowChangeDelegadoDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeDelegado}
              disabled={!newDelegadoEmail.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

