"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Pencil, Phone, Search, Trash2 } from "lucide-react"
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
import { apiCall } from "@/lib/utils/apiClient"

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

  const sortDirection = (field: string) =>
    sortBy === field && sortOrder !== 'original' ? sortOrder : null

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
      await deleteArbitro(arbitroToDelete)
      setArbitros((prev) => prev.filter((a) => a.id !== arbitroToDelete))
      toast.success("Árbitro eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el árbitro")
    } finally {
      setIsDeleting(false)
      setArbitroToDelete(null)
    }
  }

  const rowActions = (arbitro: ArbitroRow): AdminRowAction[] => [
    { label: "Editar", icon: Pencil, href: `/admin/arbitros/${arbitro.id}/editar` },
    { label: "Eliminar", icon: Trash2, onSelect: () => setArbitroToDelete(arbitro.id), destructive: true },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, título o club..."
            className="pl-10 w-full"
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
            <DropdownMenuItem onClick={() => handleSort('name')} className="justify-between">
              Nombre
              <AdminSortIcon direction={sortDirection('name')} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('title')} className="justify-between">
              Título
              <AdminSortIcon direction={sortDirection('title')} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('club')} className="justify-between">
              Club
              <AdminSortIcon direction={sortDirection('club')} />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('phone')} className="justify-between">
              Teléfono
              <AdminSortIcon direction={sortDirection('phone')} />
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
                  <AdminSortIcon direction={sortDirection('name')} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  Título
                  <AdminSortIcon direction={sortDirection('title')} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('club')}>
                <div className="flex items-center gap-1">
                  Club
                  <AdminSortIcon direction={sortDirection('club')} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('phone')}>
                <div className="flex items-center gap-1">
                  Teléfono
                  <AdminSortIcon direction={sortDirection('phone')} />
                </div>
              </TableHead>
              <TableHead className="w-[60px]">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArbitros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
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
                    <AdminRowActions actions={rowActions(arbitro)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredArbitros.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron árbitros
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArbitros.map((arbitro) => (
              <div key={arbitro.id} className="rounded-lg border bg-card p-4">
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
                          <Phone className="h-3.5 w-3.5 text-amber" />
                          <span>{arbitro.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <AdminRowActions actions={rowActions(arbitro)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={arbitroToDelete !== null}
        onOpenChange={(open) => !open && setArbitroToDelete(null)}
        title="¿Eliminar árbitro?"
        onConfirm={handleDeleteArbitro}
        pending={isDeleting}
      />
    </div>
  )
}
