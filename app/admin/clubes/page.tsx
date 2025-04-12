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

// Mock data for clubs
const mockClubs: Club[] = [
  {
    id: 1,
    name: "Club de Ajedrez Buenos Aires",
    address: "Av. Rivadavia 1234, Buenos Aires",
    telephone: "(11) 4567-8901",
    mail: "info@cabuenosaires.com.ar",
    schedule: "Lunes a Viernes: 10:00 - 22:00, Sábados: 10:00 - 18:00",
    delegado: "Juan Pérez",
    estado: "activo"
  },
  {
    id: 2,
    name: "Club de Ajedrez La Plata",
    address: "Calle 7 entre 45 y 46, La Plata",
    telephone: "(221) 123-4567",
    mail: "contacto@caplata.org",
    schedule: "Martes a Domingo: 14:00 - 23:00",
    delegado: "María González",
    estado: "activo"
  },
  {
    id: 3,
    name: "Club de Ajedrez Rosario",
    address: "San Martín 789, Rosario",
    telephone: "(341) 987-6543",
    mail: "info@carosario.com",
    schedule: "Lunes a Sábado: 09:00 - 21:00",
    delegado: "Carlos Rodríguez",
    estado: "activo"
  },
  {
    id: 4,
    name: "Club de Ajedrez Mar del Plata",
    address: "Av. Colón 2345, Mar del Plata",
    telephone: "(223) 456-7890",
    mail: "info@camardelplata.org",
    schedule: "Miércoles a Domingo: 15:00 - 22:00",
    delegado: "Ana Martínez",
    estado: "activo"
  },
  {
    id: 5,
    name: "Club de Ajedrez Quilmes",
    address: "Mitre 567, Quilmes",
    telephone: "(11) 2345-6789",
    mail: "contacto@caquilmes.com",
    schedule: "Lunes a Viernes: 16:00 - 23:00",
    delegado: "Lucas Fernández",
    estado: "inactivo"
  }
]

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

  // Fetch clubs from mock data
  useEffect(() => {
    async function fetchClubs() {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use mock data instead of fetching from Supabase
        setClubes(mockClubs)
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update the local state by filtering out the deleted club
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update the local state
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteClub}>
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
              Asigna un nuevo delegado para el club {selectedClub?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nombre del nuevo delegado"
              value={newDelegado}
              onChange={(e) => setNewDelegado(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeDelegadoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeDelegado}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

