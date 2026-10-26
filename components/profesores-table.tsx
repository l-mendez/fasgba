"use client"

import { useState } from "react"
import { Pencil, Trash2, Search, MapPin, Users2, Mail, Phone } from "lucide-react"

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
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions, type AdminRowAction } from "@/components/admin-row-actions"
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
      toast.success("Profesor eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el profesor")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const rowActions = (profesor: Profesor): AdminRowAction[] => [
    { label: "Editar", icon: Pencil, href: `/admin/profesores/${profesor.id}/editar` },
    { label: "Eliminar", icon: Trash2, onSelect: () => setDeleteId(profesor.id), destructive: true },
  ]

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
              <TableHead className="w-[60px]">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfesores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron profesores
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
                  <TableCell className="text-right">
                    <AdminRowActions actions={rowActions(profesor)} />
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
            No se encontraron profesores
          </div>
        ) : (
          filteredProfesores.map((profesor) => (
            <div key={profesor.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 font-medium">{profesor.titulo}</h3>
                <AdminRowActions actions={rowActions(profesor)} />
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

      <AdminConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar profesor?"
        description="Esta acción no se puede deshacer. También se eliminará su foto."
        onConfirm={handleDelete}
        pending={isDeleting}
      />
    </div>
  )
}
