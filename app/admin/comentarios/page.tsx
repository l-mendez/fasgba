"use client"

import { useState } from "react"
import { Calendar, ChevronDown, Eye, Flag, MoreHorizontal, Search, Trash2 } from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Datos de ejemplo para los comentarios
const comentariosData = [
  {
    id: 1,
    contenido:
      "¡Excelente noticia para el ajedrez de la región! Felicitaciones al Club Villa Mitre por sumarse a FASGBA.",
    autor: "Pedro González",
    fecha: "27/03/2025 14:32",
    noticia: "Bahía Blanca suma una nueva entidad al ajedrez federado regional",
    reportado: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    contenido: "Muy buena iniciativa. El ajedrez es una herramienta importante para mantener viva la memoria.",
    autor: "Laura Gómez",
    fecha: "27/03/2025 10:15",
    noticia: "Ajedrez por la memoria verdad y justicia",
    reportado: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    contenido: "Este comentario contiene lenguaje inapropiado y ha sido reportado por varios usuarios.",
    autor: "Usuario Anónimo",
    fecha: "27/03/2025 09:45",
    noticia: "Ajedrez por la memoria verdad y justicia",
    reportado: true,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    contenido: "¡Felicitaciones al Club Patriotas! Espero poder participar pronto en algún torneo allí.",
    autor: "Carlos Martínez",
    fecha: "20/03/2025 16:20",
    noticia: "Nueva entidad se suma a FASGBA: Club Patriotas de Punta Alta",
    reportado: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    contenido: "Este comentario contiene spam y enlaces sospechosos que han sido reportados.",
    autor: "Usuario Desconocido",
    fecha: "14/03/2025 11:30",
    noticia: "San Luis suma una nueva entidad al ajedrez federado argentino",
    reportado: true,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    contenido: "Muy buena noticia para el desarrollo del ajedrez en ambas instituciones. ¡Felicitaciones!",
    autor: "Ana Rodríguez",
    fecha: "14/03/2025 09:10",
    noticia: "FASGBA y AFA consolidan su trabajo conjunto con nuevos proyectos para 2025",
    reportado: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function AdminComentariosPage() {
  const [comentarios, setComentarios] = useState(comentariosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [comentarioToDelete, setComentarioToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedComentario, setSelectedComentario] = useState(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  // Filtrar comentarios según término de búsqueda
  const filteredComentarios = comentarios.filter(
    (comentario) =>
      comentario.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comentario.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comentario.noticia.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para eliminar un comentario
  const handleDeleteComentario = () => {
    setComentarios(comentarios.filter((comentario) => comentario.id !== comentarioToDelete))
    setShowDeleteDialog(false)
    setComentarioToDelete(null)
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Comentarios</h1>
          <p className="text-muted-foreground">Gestiona los comentarios de las noticias y publicaciones.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por contenido, autor o noticia..."
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
            <DropdownMenuItem onClick={() => setSearchTerm("reportado")}>Reportados</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autor</TableHead>
              <TableHead className="w-[400px]">Comentario</TableHead>
              <TableHead>Noticia</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComentarios.map((comentario) => (
              <TableRow key={comentario.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comentario.avatar} alt={comentario.autor} />
                      <AvatarFallback className="bg-amber/10 text-amber-dark">
                        {comentario.autor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{comentario.autor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="truncate max-w-[400px]">{comentario.contenido}</p>
                </TableCell>
                <TableCell>
                  <p className="truncate max-w-[200px]">{comentario.noticia}</p>
                </TableCell>
                <TableCell>{comentario.fecha}</TableCell>
                <TableCell>
                  {comentario.reportado ? (
                    <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-500">
                      Reportado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500">
                      Aprobado
                    </Badge>
                  )}
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
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedComentario(comentario)
                          setShowViewDialog(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver completo
                      </DropdownMenuItem>
                      {comentario.reportado && (
                        <DropdownMenuItem>
                          <Flag className="mr-2 h-4 w-4" />
                          Ver reportes
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setComentarioToDelete(comentario.id)
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

      {/* Diálogo de confirmación para eliminar comentario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteComentario}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver comentario completo */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario completo</DialogTitle>
          </DialogHeader>
          {selectedComentario && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedComentario.avatar} alt={selectedComentario.autor} />
                  <AvatarFallback className="bg-amber/10 text-amber-dark">
                    {selectedComentario.autor
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedComentario.autor}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{selectedComentario.fecha}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p>{selectedComentario.contenido}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Noticia:</p>
                <p className="text-sm text-muted-foreground">{selectedComentario.noticia}</p>
              </div>
              {selectedComentario.reportado && (
                <div>
                  <p className="text-sm font-medium text-red-500">Motivo del reporte:</p>
                  <p className="text-sm text-muted-foreground">
                    Este comentario ha sido reportado por contener contenido inapropiado o spam.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
            {selectedComentario && (
              <Button
                variant="destructive"
                onClick={() => {
                  setComentarioToDelete(selectedComentario.id)
                  setShowViewDialog(false)
                  setShowDeleteDialog(true)
                }}
              >
                Eliminar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

