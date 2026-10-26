"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Search, MapPin, Users2, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { InfoPill } from "@/components/info-pill"
import { getModalidades } from "@/lib/profesorModalidad"
import { apiCall } from "@/lib/utils/apiClient"
import { toast } from "sonner"

interface Profesor {
  id: number
  titulo: string
  foto: string | null
  club_id: number | null
  anio_nacimiento: number | null
  modalidad: string
  zona: string | null
  biografia: string | null
  email: string | null
  telefono: string | null
  tarifa_horaria: string | null
  club_name: string | null
}

interface ProfesoresTableProps {
  profesores: Profesor[]
}

function ModalidadPills({ modalidad }: { modalidad: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {getModalidades(modalidad).map(({ label, icon }) => (
        <InfoPill key={label} icon={icon}>{label}</InfoPill>
      ))}
    </div>
  )
}

export function ProfesoresTable({ profesores: initialProfesores }: ProfesoresTableProps) {
  const router = useRouter()
  const [profesores, setProfesores] = useState(initialProfesores)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState("all")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredProfesores = profesores.filter((profesor) => {
    const matchesSearch =
      profesor.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profesor.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (profesor.zona?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesModalidad = modalidadFilter === "all" || profesor.modalidad === modalidadFilter

    return matchesSearch && matchesModalidad
  })

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await apiCall(`/api/profesores/${deleteId}`, {
        method: 'DELETE',
      })

      setProfesores(prev => prev.filter(p => p.id !== deleteId))
      toast.success("Profesor eliminado correctamente")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el profesor")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, club o zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Modalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead className="hidden lg:table-cell">Zona</TableHead>
              <TableHead className="w-[90px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfesores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron profesores.
                </TableCell>
              </TableRow>
            ) : (
              filteredProfesores.map((profesor) => (
                <TableRow key={profesor.id}>
                  <TableCell className="font-medium">{profesor.titulo}</TableCell>
                  <TableCell>{profesor.club_name || "—"}</TableCell>
                  <TableCell>
                    <ModalidadPills modalidad={profesor.modalidad} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{profesor.zona || "—"}</TableCell>
                  <TableCell>
                    <div className="flex shrink-0 justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" title="Editar">
                        <Link href={`/admin/profesores/${profesor.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Eliminar"
                        title="Eliminar"
                        onClick={() => setDeleteId(profesor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredProfesores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron profesores.
          </div>
        ) : (
          filteredProfesores.map((profesor) => (
            <div key={profesor.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{profesor.titulo}</h3>
                <div className="flex shrink-0 justify-end gap-1">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" title="Editar">
                    <Link href={`/admin/profesores/${profesor.id}/editar`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label="Eliminar"
                    title="Eliminar"
                    onClick={() => setDeleteId(profesor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                {profesor.club_name && (
                  <span className="flex items-center gap-1">
                    <Users2 className="h-3.5 w-3.5 text-amber" />
                    {profesor.club_name}
                  </span>
                )}
                {profesor.zona && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber" />
                    {profesor.zona}
                  </span>
                )}
                {profesor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-amber" />
                    {profesor.email}
                  </span>
                )}
                {profesor.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-amber" />
                    {profesor.telefono}
                  </span>
                )}
              </div>
              <ModalidadPills modalidad={profesor.modalidad} />
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar profesor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el profesor y su imagen asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
