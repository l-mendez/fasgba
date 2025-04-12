"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, GraduationCap, MoreHorizontal, Plus, Search, Trash2, Users } from "lucide-react"

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

// Datos de ejemplo para los cursos
const cursosData = [
  {
    id: "iniciacion-ajedrez",
    titulo: "Iniciación al Ajedrez",
    instructor: "Carlos Rodríguez",
    fechaInicio: "10/04/2025",
    fechaFin: "15/05/2025",
    nivel: "Principiante",
    categoria: "general",
    modalidad: "Presencial",
    cupos: 15,
    inscritos: 7,
    estado: "próximo",
  },
  {
    id: "tactica-intermedia",
    titulo: "Táctica para Nivel Intermedio",
    instructor: "Laura Martínez",
    fechaInicio: "05/05/2025",
    fechaFin: "30/06/2025",
    nivel: "Intermedio",
    categoria: "general",
    modalidad: "Presencial",
    cupos: 12,
    inscritos: 7,
    estado: "próximo",
  },
  {
    id: "finales-avanzados",
    titulo: "Finales Avanzados",
    instructor: "Martín López",
    fechaInicio: "03/06/2025",
    fechaFin: "22/07/2025",
    nivel: "Avanzado",
    categoria: "general",
    modalidad: "Presencial",
    cupos: 10,
    inscritos: 7,
    estado: "próximo",
  },
  {
    id: "ajedrez-infantil",
    titulo: "Ajedrez para Niños",
    instructor: "Ana García",
    fechaInicio: "15/04/2025",
    fechaFin: "30/05/2025",
    nivel: "Principiante",
    categoria: "infantil",
    modalidad: "Presencial",
    cupos: 15,
    inscritos: 8,
    estado: "próximo",
  },
  {
    id: "aperturas-espanola-italiana",
    titulo: "Aperturas: Española e Italiana",
    instructor: "Pablo Sánchez",
    fechaInicio: "20/05/2025",
    fechaFin: "24/06/2025",
    nivel: "Intermedio",
    categoria: "aperturas",
    modalidad: "Online",
    cupos: 20,
    inscritos: 8,
    estado: "próximo",
  },
  {
    id: "curso-arbitraje-regional",
    titulo: "Curso de Árbitro Regional",
    instructor: "Roberto Martínez",
    fechaInicio: "15/07/2025",
    fechaFin: "16/07/2025",
    nivel: "Todos los niveles",
    categoria: "arbitraje",
    modalidad: "Presencial",
    cupos: 20,
    inscritos: 5,
    estado: "próximo",
  },
  {
    id: "defensa-siciliana",
    titulo: "Defensa Siciliana: Variante Najdorf",
    instructor: "Lucía Fernández",
    fechaInicio: "07/06/2025",
    fechaFin: "12/07/2025",
    nivel: "Avanzado",
    categoria: "aperturas",
    modalidad: "Online",
    cupos: 15,
    inscritos: 6,
    estado: "próximo",
  },
]

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState(cursosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [cursoToDelete, setCursoToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filtrar cursos según término de búsqueda
  const filteredCursos = cursos.filter(
    (curso) =>
      curso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.nivel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para eliminar un curso
  const handleDeleteCurso = () => {
    setCursos(cursos.filter((curso) => curso.id !== cursoToDelete))
    setShowDeleteDialog(false)
    setCursoToDelete(null)
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Cursos</h1>
          <p className="text-muted-foreground">Gestiona los cursos y talleres de FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/cursos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Curso
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, instructor o nivel..."
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
            <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("general")}>General</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("infantil")}>Infantil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("aperturas")}>Aperturas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("arbitraje")}>Arbitraje</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Inscripciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCursos.map((curso) => (
              <TableRow key={curso.id}>
                <TableCell className="font-medium">{curso.titulo}</TableCell>
                <TableCell>{curso.instructor}</TableCell>
                <TableCell>{`${curso.fechaInicio} al ${curso.fechaFin}`}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      curso.nivel === "Principiante"
                        ? "border-green-500 bg-green-500/10 text-green-500"
                        : curso.nivel === "Intermedio"
                          ? "border-amber bg-amber/10 text-amber-dark"
                          : curso.nivel === "Avanzado"
                            ? "border-red-500 bg-red-500/10 text-red-500"
                            : "border-blue-500 bg-blue-500/10 text-blue-500"
                    }
                  >
                    {curso.nivel}
                  </Badge>
                </TableCell>
                <TableCell>{curso.categoria.charAt(0).toUpperCase() + curso.categoria.slice(1)}</TableCell>
                <TableCell>{curso.modalidad}</TableCell>
                <TableCell>{`${curso.inscritos}/${curso.cupos}`}</TableCell>
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
                        <Link href={`/cursos/${curso.id}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver en sitio
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/cursos/${curso.id}/editar`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/cursos/${curso.id}/inscripciones`}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver inscripciones
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/cursos/${curso.id}/instructor`}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Cambiar instructor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setCursoToDelete(curso.id)
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

      {/* Diálogo de confirmación para eliminar curso */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCurso}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

