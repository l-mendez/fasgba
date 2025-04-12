"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  delegado?: string
  estado?: string
}

export default function AdminClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [clubToDelete, setClubToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showChangeDelegadoDialog, setShowChangeDelegadoDialog] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [newDelegado, setNewDelegado] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch clubs from the database
  useEffect(() => {
    async function fetchClubs() {
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .order('name')

        if (error) throw error

        // Transform the data to match our UI format
        const transformedClubs: Club[] = (data || []).map((club: any) => ({
          id: club.id,
          name: club.name,
          address: club.address,
          telephone: club.telephone,
          mail: club.mail,
          schedule: club.schedule,
          delegado: "Por asignar", // This should come from club_admins table in a real implementation
          estado: "activo" // This should come from a status field in the clubs table in a real implementation
        }))

        setClubes(transformedClubs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los clubes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClubs()
  }, [])

  // Filtrar clubes según término de búsqueda
  const filteredClubes = clubes.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.delegado?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  // Función para eliminar un club
  const handleDeleteClub = async () => {
    if (!clubToDelete) return

    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubToDelete)

      if (error) throw error

      setClubes(clubes.filter((club) => club.id !== clubToDelete))
      setShowDeleteDialog(false)
      setClubToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el club")
    }
  }

  // Función para cambiar el delegado de un club
  const handleChangeDelegado = async () => {
    if (!selectedClub) return

    try {
      // Here you would typically update the club_admins table
      // For now, we'll just update the local state
      setClubes(clubes.map((club) => 
        club.id === selectedClub.id 
          ? { ...club, delegado: newDelegado } 
          : club
      ))
      setShowChangeDelegadoDialog(false)
      setSelectedClub(null)
      setNewDelegado("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar el delegado")
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
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
            <Button variant="outline">
              Filtrar
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("activo")}>Activos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("inactivo")}>Inactivos</DropdownMenuItem>
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
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClubes.map((club) => (
              <TableRow key={club.id}>
                <TableCell className="font-medium">{club.name}</TableCell>
                <TableCell>{club.delegado}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs">{club.mail}</span>
                    <span className="text-xs text-muted-foreground">{club.telephone}</span>
                  </div>
                </TableCell>
                <TableCell>{club.schedule}</TableCell>
                <TableCell>
                  <Badge
                    variant={club.estado === "activo" ? "default" : "outline"}
                    className={
                      club.estado === "activo" ? "bg-green-500 hover:bg-green-500/80" : "text-muted-foreground"
                    }
                  >
                    {club.estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
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
                          setNewDelegado(club.delegado || "")
                          setShowChangeDelegadoDialog(true)
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Cambiar delegado
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setClubToDelete(club.id)
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación para eliminar club */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este club? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteClub}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para cambiar delegado */}
      <Dialog open={showChangeDelegadoDialog} onOpenChange={setShowChangeDelegadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar delegado</DialogTitle>
            <DialogDescription>Ingresa el nombre del nuevo delegado para {selectedClub?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="delegado" className="text-right text-sm font-medium">
                Delegado
              </label>
              <Input
                id="delegado"
                value={newDelegado}
                onChange={(e) => setNewDelegado(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeDelegadoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeDelegado}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

