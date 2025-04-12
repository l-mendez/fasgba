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

// Datos de ejemplo para los torneos
const torneosData = [
  {
    id: "gran-prix-2025",
    nombre: "Gran Prix FASGBA 2025",
    fechaInicio: "15/04/2025",
    fechaFin: "15/04/2025",
    lugar: "Club de Ajedrez Bahía Blanca",
    organizador: "Carlos Martínez",
    estado: "próximo",
    inscripciones: 45,
  },
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
    id: "campeonato-regional-junio",
    nombre: "Campeonato Regional Individual",
    fechaInicio: "10/06/2025",
    fechaFin: "12/06/2025",
    lugar: "Club de Ajedrez Tres Arroyos",
    organizador: "Roberto Sánchez",
    estado: "próximo",
    inscripciones: 28,
  },
  {
    id: "regional-equipos-2024",
    nombre: "Campeonato Regional por Equipos",
    fechaInicio: "01/03/2025",
    fechaFin: "30/05/2025",
    lugar: "Sedes rotativas",
    organizador: "María López",
    estado: "en curso",
    inscripciones: 12,
  },
  {
    id: "torneo-escolar-2024",
    nombre: "Torneo Escolar FASGBA",
    fechaInicio: "01/04/2025",
    fechaFin: "30/06/2025",
    lugar: "Club de Ajedrez Bahía Blanca",
    organizador: "Juan Pérez",
    estado: "en curso",
    inscripciones: 35,
  },
  {
    id: "abierto-verano-2024",
    nombre: "Abierto de Verano 2024",
    fechaInicio: "05/01/2024",
    fechaFin: "07/01/2024",
    lugar: "Club de Ajedrez Monte Hermoso",
    organizador: "Ana Rodríguez",
    estado: "finalizado",
    inscripciones: 48,
  },
  {
    id: "copa-aniversario-2023",
    nombre: "Copa Aniversario FASGBA 2023",
    fechaInicio: "15/05/2023",
    fechaFin: "15/05/2023",
    lugar: "Círculo de Ajedrez Pigüé",
    organizador: "Pedro González",
    estado: "finalizado",
    inscripciones: 52,
  },
]

export default function AdminTorneosPage() {
  const [torneos, setTorneos] = useState(torneosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [torneoToDelete, setTorneoToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filtrar torneos según término de búsqueda
  const filteredTorneos = torneos.filter(
    (torneo) =>
      torneo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      torneo.lugar.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <p className="text-muted-foreground">Gestiona los torneos y competiciones de FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/torneos/nuevo">
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
            placeholder="Buscar por nombre, lugar u organizador..."
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
            <DropdownMenuItem onClick={() => setSearchTerm("en curso")}>En curso</DropdownMenuItem>
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
              <TableHead>Lugar</TableHead>
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
                <TableCell>{torneo.lugar}</TableCell>
                <TableCell>{torneo.organizador}</TableCell>
                <TableCell>
                  <Badge
                    variant={torneo.estado === "finalizado" ? "outline" : "default"}
                    className={
                      torneo.estado === "próximo"
                        ? "bg-blue-500 hover:bg-blue-500/80"
                        : torneo.estado === "en curso"
                          ? "bg-green-500 hover:bg-green-500/80"
                          : "text-muted-foreground"
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

