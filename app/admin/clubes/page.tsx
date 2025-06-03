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
import { createClient } from "@/lib/supabase/client"

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  // Extended properties for display
  adminCount?: number
}

interface ClubAdmin {
  id: string
  email: string
}

// API utility functions
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
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

export default function AdminClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [clubToDelete, setClubToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<Club[]>([])

  // Fetch clubs from API
  useEffect(() => {
    async function loadClubs() {
      try {
        setIsLoading(true)
        setError(null)
        const clubsData = await fetchClubs()
        setClubes(clubsData)
        setOriginalOrder(clubsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los clubes")
      } finally {
        setIsLoading(false)
      }
    }

    loadClubs()
  }, [])

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

  const getSortedClubes = (clubesToSort: Club[]) => {
    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(club => 
        clubesToSort.some(filtered => filtered.id === club.id)
      )
    }

    const sorted = [...clubesToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'contact':
          aValue = (a.mail || a.telephone || '').toLowerCase()
          bValue = (b.mail || b.telephone || '').toLowerCase()
          break
        case 'schedule':
          aValue = (a.schedule || '').toLowerCase()
          bValue = (b.schedule || '').toLowerCase()
          break
        case 'admins':
          aValue = a.adminCount || 0
          bValue = b.adminCount || 0
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

  // Filter clubs by search term
  const filteredClubes = clubes.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Apply sorting to filtered clubs
  const sortedAndFilteredClubes = getSortedClubes(filteredClubes)

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
    <div className="flex flex-col gap-8 p-8 pb-16 md:pb-8">
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
        <div className="flex gap-2">
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
              <DropdownMenuItem onClick={() => handleSort('contact')}>
                Contacto {getSortIcon('contact')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('schedule')}>
                Horarios {getSortIcon('schedule')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('admins')}>
                Delegados {getSortIcon('admins')}
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
                  onClick={() => handleSort('contact')}
                >
                  <div className="flex items-center gap-1">
                    Contacto
                    {getSortIcon('contact') && <span className="text-xs">{getSortIcon('contact')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('schedule')}
                >
                  <div className="flex items-center gap-1">
                    Horarios
                    {getSortIcon('schedule') && <span className="text-xs">{getSortIcon('schedule')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('admins')}
                >
                  <div className="flex items-center gap-1">
                    Delegados
                    {getSortIcon('admins') && <span className="text-xs">{getSortIcon('admins')}</span>}
                  </div>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredClubes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No se encontraron clubes
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredClubes.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{club.mail || "Sin email"}</span>
                        <span className="text-xs text-muted-foreground">{club.telephone || "Sin teléfono"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{club.schedule || "Sin horarios"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {club.adminCount || 0}
                      </span>
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

        {/* Mobile Card View - Hidden on desktop */}
        <div className="md:hidden pb-8">
          {sortedAndFilteredClubes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron clubes
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAndFilteredClubes.map((club) => (
                <div key={club.id} className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-5 text-card-foreground mb-2 line-clamp-2">
                        {club.name}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <span className="font-medium text-terracotta">
                            {club.mail || "Sin email"}
                          </span>
                          <span>{club.telephone || "Sin teléfono"}</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {club.schedule || "Sin horarios"}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{club.adminCount || 0}</span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>

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
    </div>
  )
}