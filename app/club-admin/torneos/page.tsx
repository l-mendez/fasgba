"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, Users } from "lucide-react"

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

// Datos de ejemplo para los torneos del club
const torneosData = [
  {
    id: "torneo-rapido-mayo",
    nombre: "Torneo Rápido de Mayo",
    fechaInicio: "25/05/2025",
    fechaFin: "25/05/2025",
    lugar: "Círculo de Ajedrez Punta Alta",
    organizador: "Laura Gómez",
    estado: "próximo",
    inscripciones: 32,
  },
  {
    id: "torneo-infantil-junio",
    nombre: "Torneo Infantil de Junio",
    fechaInicio: "15/06/2025",
    fechaFin: "15/06/2025",
    lugar: "Círculo de Ajedrez Punta Alta",
    organizador: "Tomás Rodríguez",
    estado: "próximo",
    inscripciones: 18,
  },
  {
    id: "campeonato-club-2025",
    nombre: "Campeonato del Club 2025",
    fechaInicio: "01/07/2025",
    fechaFin: "30/07/2025",
    lugar: "Círculo de Ajedrez Punta Alta",
    organizador: "Laura Gómez",
    estado: "próximo",
    inscripciones: 24,
  },
  {
    id: "torneo-febrero-2025",
    nombre: "Torneo de Febrero 2025",
    fechaInicio: "15/02/2025",
    fechaFin: "15/02/2025",
    lugar: "Círculo de Ajedrez Punta Alta",
    organizador: "Carlos Rodríguez",
    estado: "finalizado",
    inscripciones: 28,
  },
  {
    id: "torneo-navidad-2024",
    nombre: "Torneo de Navidad 2024",
    fechaInicio: "20/12/2024",
    fechaFin: "20/12/2024",
    lugar: "Círculo de Ajedrez Punta Alta",
    organizador: "Laura Gómez",
    estado: "finalizado",
    inscripciones: 35,
  },
]

export default function ClubAdminTorneosPage() {
  const [torneos, setTorneos] = useState(torneosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [torneoToDelete, setTorneoToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filtrar torneos según término de búsqueda
  const filteredTorneos = torneos.filter(
    (torneo) =>
      torneo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      torneo.organizador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      torneo.estado.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para eliminar un torneo
  const handleDeleteTorneo = () => {
    setTorneos(torneos.filter((torneo) => torneo.id !== torneoToDelete))
    setShowDeleteDialog(false)
    setTorneoToDelete(null)
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Torneos</h1>
          <p className="text-muted-foreground">Gestiona los torneos organizados por tu club.</p>
        </div>
        <Button asChild>
          <Link href="/club-admin/torneos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre u organizador..."
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
              <TableHead>Organizador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inscripciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTorneos.map((torneo) => (
              <TableRow key={torneo.id}>
                <TableCell className="font-medium">{torneo.nombre}</TableCell>
                <TableCell>
                  {torneo.fechaInicio === torneo.fechaFin
                    ? torneo.fechaInicio
                    : `${torneo.fechaInicio} al ${torneo.fechaFin}`}
                </TableCell>
                <TableCell>{torneo.organizador}</TableCell>
                <TableCell>
                  <Badge
                    variant={torneo.estado === "finalizado" ? "outline" : "default"}
                    className={
                      torneo.estado === "próximo" ? "bg-blue-500 hover:bg-blue-500/80" : "text-muted-foreground"
                    }
                  >
                    {torneo.estado.charAt(0).toUpperCase() + torneo.estado.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{torneo.inscripciones}</TableCell>
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
            ))}
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

