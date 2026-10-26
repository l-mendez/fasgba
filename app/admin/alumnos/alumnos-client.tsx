"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Trash2, UserPlus, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin-page-header"
import { AdminRowActions } from "@/components/admin-row-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatArgentinaDate } from "@/lib/documentosUtils"
import { apiCall } from "@/lib/utils/apiClient"

interface Alumno {
  auth_id: string
  email: string
  nombre: string
  apellido: string
  created_at: string
}

interface UserResult {
  id: string
  email: string
  nombre: string
  apellido: string
  club_name?: string
}

interface RawUserResult {
  id: string
  email?: string | null
  user_metadata?: {
    nombre?: unknown
    apellido?: unknown
  } | null
  club_name?: string | null
}

const PER_PAGE = 8

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

interface AdminAlumnosClientProps {
  initialAlumnos: Alumno[]
  initialUsers: UserResult[]
  initialUsersTotal: number
}

export function AdminAlumnosClient({
  initialAlumnos,
  initialUsers,
  initialUsersTotal,
}: AdminAlumnosClientProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>(initialAlumnos)
  const [alumnosSearch, setAlumnosSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [alumnoToRemove, setAlumnoToRemove] = useState<Alumno | null>(null)
  const [removing, setRemoving] = useState(false)

  // Users list state
  const [users, setUsers] = useState<UserResult[]>(initialUsers)
  const [usersTotal, setUsersTotal] = useState(initialUsersTotal)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSearch, setUsersSearch] = useState("")
  const [adding, setAdding] = useState<string | null>(null)
  const hasUsedInitialUsersRef = useRef(false)

  const fetchAlumnos = useCallback(async () => {
    try {
      const json = await apiCall("/api/admin/alumnos")
      setAlumnos(json.alumnos || [])
    } catch (error) {
      console.error("Error fetching alumnos:", error)
    }
  }, [])

  const fetchUsers = useCallback(async (page: number, search: string, alumnoIds: string[]) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
      if (search.trim().length >= 3) params.set("q", search.trim())
      if (alumnoIds.length > 0) params.set("exclude", alumnoIds.join(","))
      const json = await apiCall(`/api/admin/users/search?${params}`)
      const rawUsers = (json.data?.users || json.users || []) as RawUserResult[]
      setUsers(
        rawUsers.map((u) => ({
          id: u.id,
          email: u.email || "",
          nombre: getStringValue(u.user_metadata?.nombre),
          apellido: getStringValue(u.user_metadata?.apellido),
          club_name: u.club_name || "",
        }))
      )
      setUsersTotal(json.data?.total ?? json.total ?? 0)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasUsedInitialUsersRef.current) {
      hasUsedInitialUsersRef.current = true
      return
    }

    fetchUsers(usersPage, usersSearch, alumnos.map(a => a.auth_id))
  }, [usersPage, usersSearch, alumnos, fetchUsers])

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setUsersSearch(value)
    setUsersPage(1)
  }

  const handleAddAlumno = async (authId: string) => {
    setAdding(authId)
    try {
      await apiCall("/api/admin/alumnos", {
        method: "POST",
        body: JSON.stringify({ auth_id: authId }),
      })

      toast.success("Alumno agregado")
      fetchAlumnos() // useEffect on alumnos will re-fetch users
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar alumno")
    } finally {
      setAdding(null)
    }
  }

  const handleRemoveAlumno = async () => {
    if (!alumnoToRemove) return
    setRemoving(true)
    try {
      await apiCall(`/api/admin/alumnos/${alumnoToRemove.auth_id}`, {
        method: "DELETE",
      })

      toast.success("Alumno quitado")
      setAlumnoToRemove(null)
      fetchAlumnos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al quitar alumno")
    } finally {
      setRemoving(false)
    }
  }

  const totalPages = Math.ceil(usersTotal / PER_PAGE)
  const searchLength = usersSearch.trim().length
  const alumnosQuery = alumnosSearch.trim().toLowerCase()
  const filteredAlumnos = alumnosQuery
    ? alumnos.filter((alumno) =>
        `${alumno.nombre} ${alumno.apellido} ${alumno.email}`.toLowerCase().includes(alumnosQuery)
      )
    : alumnos

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Alumnos"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Agregar alumno
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={alumnosSearch}
          onChange={(e) => setAlumnosSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Fecha de alta</TableHead>
              <TableHead className="w-[56px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {alumnos.length === 0 ? "No hay alumnos" : "No se encontraron alumnos"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAlumnos.map((alumno) => (
                <TableRow key={alumno.auth_id}>
                  <TableCell className="font-medium">
                    {alumno.nombre} {alumno.apellido}
                    <span className="block text-xs font-normal text-muted-foreground sm:hidden">{alumno.email}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{alumno.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatArgentinaDate(alumno.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <AdminRowActions
                        actions={[
                          { label: "Quitar alumno", icon: Trash2, destructive: true, onSelect: () => setAlumnoToRemove(alumno) },
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminConfirmDialog
        open={alumnoToRemove !== null}
        onOpenChange={(open) => !open && setAlumnoToRemove(null)}
        title="¿Quitar alumno?"
        description={
          alumnoToRemove
            ? `${alumnoToRemove.nombre} ${alumnoToRemove.apellido} ya no podrá acceder a los documentos de la Escuela.`
            : undefined
        }
        confirmLabel="Quitar"
        onConfirm={handleRemoveAlumno}
        pending={removing}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar alumno</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o club..."
                value={usersSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                aria-describedby="alumnos-search-hint"
              />
            </div>
            {searchLength > 0 && searchLength < 3 ? (
              <p id="alumnos-search-hint" className="text-xs text-muted-foreground">
                Escribe al menos 3 caracteres
              </p>
            ) : null}

            {usersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-terracotta" aria-label="Cargando" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {searchLength >= 3 ? "No se encontraron usuarios" : "No hay usuarios para agregar"}
              </p>
            ) : (
              <div className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2.5 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                        {user.club_name && <span className="ml-2 text-terracotta">({user.club_name})</span>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddAlumno(user.id)}
                      disabled={adding === user.id}
                      className="ml-2 shrink-0"
                      aria-label="Agregar como alumno"
                      title="Agregar como alumno"
                    >
                      {adding === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Página {usersPage} de {totalPages} ({usersTotal} usuarios)
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                    title="Página anterior"
                    disabled={usersPage <= 1 || usersLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Página siguiente"
                    title="Página siguiente"
                    disabled={usersPage >= totalPages || usersLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
