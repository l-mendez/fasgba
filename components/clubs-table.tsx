"use client"

import { useState } from "react"
import { ChevronDown, Clock, ExternalLink, Mail, Pencil, Phone, Search, Trash2, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions, type AdminRowAction } from "@/components/admin-row-actions"
import { AdminSortIcon } from "@/components/admin-sort-icon"
import type { Club } from "@/lib/clubUtils"
import { apiCall } from "@/lib/utils/apiClient"

// Extended Club interface for this component with admin stats
interface ClubWithAdminInfo extends Club {
  adminCount?: number
  delegado?: string
}

async function deleteClub(clubId: number): Promise<void> {
  await apiCall(`/api/clubs/${clubId}`, {
    method: 'DELETE',
  })
}

interface ClubsTableProps {
  initialClubs: ClubWithAdminInfo[]
}

export function ClubsTable({ initialClubs }: ClubsTableProps) {
  const [clubes, setClubes] = useState<ClubWithAdminInfo[]>(initialClubs)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDelegadoFilter, setSelectedDelegadoFilter] = useState<string>('all')
  const [clubToDelete, setClubToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<ClubWithAdminInfo[]>(initialClubs)

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

  const getSortedClubes = (clubesToSort: ClubWithAdminInfo[]) => {
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
        case 'address':
          aValue = (a.address || '').toLowerCase()
          bValue = (b.address || '').toLowerCase()
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

  const getSortIcon = (field: string) =>
    sortBy === field && sortOrder !== 'original' ? <AdminSortIcon direction={sortOrder} /> : null

  // Filter clubs by search term and delegado filter
  const filteredClubes = clubes.filter((club) => {
    const search = searchTerm.toLowerCase().trim()
    
    // Apply delegado filter
    if (selectedDelegadoFilter === 'con_delegado') {
      if (!club.delegado && (club.adminCount || 0) === 0) return false
    } else if (selectedDelegadoFilter === 'sin_delegado') {
      if (club.delegado || (club.adminCount || 0) > 0) return false
    }
    
    // Apply text search (only if there's a search term)
    if (search) {
      return club.name.toLowerCase().includes(search) ||
             (club.address && club.address.toLowerCase().includes(search)) ||
             (club.mail && club.mail.toLowerCase().includes(search)) ||
             (club.telephone && club.telephone.toLowerCase().includes(search)) ||
             (club.delegado && club.delegado.toLowerCase().includes(search))
    }
    
    return true
  })

  // Apply sorting to filtered clubs
  const sortedAndFilteredClubes = getSortedClubes(filteredClubes)

  // Function to delete a club
  const handleDeleteClub = async () => {
    if (!clubToDelete) return

    try {
      setIsDeleting(true)
      await deleteClub(clubToDelete)
      
      // Update the local state by filtering out the deleted club
      setClubes(clubes.filter((club) => club.id !== clubToDelete))
      setOriginalOrder(originalOrder.filter((club) => club.id !== clubToDelete))
      toast.success("Club eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el club")
    } finally {
      setIsDeleting(false)
      setClubToDelete(null)
    }
  }

  const getRowActions = (club: ClubWithAdminInfo): AdminRowAction[] => [
    { label: "Ver en sitio", icon: ExternalLink, href: `/clubes/${club.id}`, external: true },
    { label: "Editar", icon: Pencil, href: `/admin/clubes/${club.id}/editar` },
    { label: "Eliminar", icon: Trash2, destructive: true, onSelect: () => setClubToDelete(club.id) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, dirección, email, teléfono o delegado..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                {selectedDelegadoFilter === 'all' ? 'Todos los clubes' :
                 selectedDelegadoFilter === 'con_delegado' ? 'Con delegado' :
                 selectedDelegadoFilter === 'sin_delegado' ? 'Sin delegado' : 'Filtrar'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por delegados</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedDelegadoFilter('all')}>Todos los clubes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDelegadoFilter('con_delegado')}>Con delegado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDelegadoFilter('sin_delegado')}>Sin delegado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Ordenar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-1" onClick={() => handleSort('name')}>
                Nombre {getSortIcon('name')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-1" onClick={() => handleSort('address')}>
                Dirección {getSortIcon('address')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-1" onClick={() => handleSort('contact')}>
                Contacto {getSortIcon('contact')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-1" onClick={() => handleSort('schedule')}>
                Horarios {getSortIcon('schedule')}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-1" onClick={() => handleSort('admins')}>
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
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('address')}
                >
                  <div className="flex items-center gap-1">
                    Dirección
                    {getSortIcon('address')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('contact')}
                >
                  <div className="flex items-center gap-1">
                    Contacto
                    {getSortIcon('contact')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden lg:table-cell cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('schedule')}
                >
                  <div className="flex items-center gap-1">
                    Horarios
                    {getSortIcon('schedule')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('admins')}
                >
                  <div className="flex items-center gap-1">
                    Delegados
                    {getSortIcon('admins')}
                  </div>
                </TableHead>
                <TableHead className="w-[60px]"><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredClubes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No se encontraron clubes
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredClubes.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell>{club.address || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{club.mail || "—"}</span>
                        {club.telephone && <span className="text-xs text-muted-foreground">{club.telephone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{club.schedule || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {club.adminCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminRowActions actions={getRowActions(club)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="md:hidden">
          {sortedAndFilteredClubes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clubes
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAndFilteredClubes.map((club) => (
                <div key={club.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="line-clamp-2 text-sm font-medium">{club.name}</h3>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {club.address && <p>{club.address}</p>}
                        {club.mail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-amber" />
                            <span className="truncate">{club.mail}</span>
                          </div>
                        )}
                        {club.telephone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-amber" />
                            <span>{club.telephone}</span>
                          </div>
                        )}
                        {club.schedule && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-amber" />
                            <span className="truncate">{club.schedule}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5" title="Delegados">
                          <User className="h-3.5 w-3.5 shrink-0 text-amber" />
                          <span>{club.adminCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <AdminRowActions actions={getRowActions(club)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>

      <AdminConfirmDialog
        open={clubToDelete !== null}
        onOpenChange={(open) => !open && setClubToDelete(null)}
        title="¿Eliminar club?"
        onConfirm={handleDeleteClub}
        pending={isDeleting}
      />
    </div>
  )
} 
