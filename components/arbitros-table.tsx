"use client"

import { useState, useMemo } from "react"
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Search,
  ChevronDown,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ArbitroRow {
  id: number
  name: string
  title: string
  photo: string | null
  club_id: number | null
  club_name: string | null
  phone: string | null
  bio: string | null
}

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

async function deleteArbitro(arbitroId: number): Promise<void> {
  await apiCall(`/api/arbitros/${arbitroId}`, {
    method: 'DELETE',
  })
}

interface ArbitrosTableProps {
  initialArbitros: ArbitroRow[]
}

export function ArbitrosTable({ initialArbitros }: ArbitrosTableProps) {
  const [arbitros, setArbitros] = useState<ArbitroRow[]>(initialArbitros)
  const [searchTerm, setSearchTerm] = useState("")
  const [arbitroToDelete, setArbitroToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder] = useState<ArbitroRow[]>(initialArbitros)

  const handleSort = (field: string) => {
    if (sortBy === field) {
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

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null
    if (sortOrder === 'asc') return '↑'
    if (sortOrder === 'desc') return '↓'
    return null
  }

  const filteredArbitros = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()
    let result = arbitros

    if (search) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(search) ||
        a.title.toLowerCase().includes(search) ||
        (a.club_name && a.club_name.toLowerCase().includes(search))
      )
    }

    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(a => result.some(r => r.id === a.id))
    }

    return [...result].sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break
        case 'title': aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); break
        case 'club': aVal = (a.club_name || '').toLowerCase(); bVal = (b.club_name || '').toLowerCase(); break
        case 'phone': aVal = (a.phone || '').toLowerCase(); bVal = (b.phone || '').toLowerCase(); break
        default: return 0
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [arbitros, searchTerm, sortBy, sortOrder, originalOrder])

  const handleDeleteArbitro = async () => {
    if (!arbitroToDelete) return

    try {
      setIsDeleting(true)
      setError(null)
      await deleteArbitro(arbitroToDelete)
      setArbitros(arbitros.filter((a) => a.id !== arbitroToDelete))
      setShowDeleteDialog(false)
      setArbitroToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el árbitro")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, título o club..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
            <DropdownMenuItem onClick={() => handleSort('name')}>
              Nombre {getSortIcon('name')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('title')}>
              Título {getSortIcon('title')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('club')}>
              Club {getSortIcon('club')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('phone')}>
              Teléfono {getSortIcon('phone')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSortBy(null); setSortOrder('original') }}>
              Orden original
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Table View */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Nombre
                  {getSortIcon('name') && <span className="text-xs">{getSortIcon('name')}</span>}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  Título
                  {getSortIcon('title') && <span className="text-xs">{getSortIcon('title')}</span>}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('club')}>
                <div className="flex items-center gap-1">
                  Club
                  {getSortIcon('club') && <span className="text-xs">{getSortIcon('club')}</span>}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('phone')}>
                <div className="flex items-center gap-1">
                  Teléfono
                  {getSortIcon('phone') && <span className="text-xs">{getSortIcon('phone')}</span>}
                </div>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArbitros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No se encontraron árbitros
                </TableCell>
              </TableRow>
            ) : (
              filteredArbitros.map((arbitro) => (
                <TableRow key={arbitro.id}>
                  <TableCell className="font-medium">{arbitro.name}</TableCell>
                  <TableCell>{arbitro.title}</TableCell>
                  <TableCell>{arbitro.club_name || "Sin club"}</TableCell>
                  <TableCell>{arbitro.phone || "—"}</TableCell>
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
                          <Link href={`/admin/arbitros/${arbitro.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setArbitroToDelete(arbitro.id)
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

      {/* Mobile Card View */}
      <div className="md:hidden pb-8">
        {filteredArbitros.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron árbitros
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArbitros.map((arbitro) => (
              <div key={arbitro.id} className="bg-card rounded-lg border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-5 text-card-foreground mb-1 line-clamp-2">
                      {arbitro.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{arbitro.title}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {arbitro.club_name || "Sin club"}
                      </span>
                      {arbitro.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{arbitro.phone}</span>
                        </div>
                      )}
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
                        <Link href={`/admin/arbitros/${arbitro.id}/editar`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setArbitroToDelete(arbitro.id)
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el árbitro.
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
              onClick={handleDeleteArbitro}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
