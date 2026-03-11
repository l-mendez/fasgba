"use client"

import { useState, useEffect, useCallback } from "react"
import {
  GraduationCap,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { formatArgentinaDate } from "@/lib/documentosUtils"

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

const PER_PAGE = 8

export default function AdminAlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Users list state
  const [users, setUsers] = useState<UserResult[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersSearch, setUsersSearch] = useState("")
  const [adding, setAdding] = useState<string | null>(null)

  const supabase = createClient()

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    }
  }

  const fetchAlumnos = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/alumnos", { headers })
      const json = await res.json()
      if (res.ok) {
        setAlumnos(json.alumnos || [])
      }
    } catch (error) {
      console.error("Error fetching alumnos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async (page: number, search: string) => {
    setUsersLoading(true)
    try {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
      if (search.trim().length >= 3) params.set("q", search.trim())
      const res = await fetch(`/api/admin/users/search?${params}`, { headers })
      const json = await res.json()
      if (res.ok) {
        const rawUsers = json.data?.users || json.users || []
        setUsers(
          rawUsers.map((u: any) => ({
            id: u.id,
            email: u.email || "",
            nombre: u.user_metadata?.nombre || "",
            apellido: u.user_metadata?.apellido || "",
            club_name: u.club_name || "",
          }))
        )
        setUsersTotal(json.data?.total ?? json.total ?? 0)
      } else {
        console.error("Error fetching users:", json.error || res.statusText)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlumnos()
  }, [fetchAlumnos])

  useEffect(() => {
    fetchUsers(usersPage, usersSearch)
  }, [usersPage, usersSearch, fetchUsers])

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setUsersSearch(value)
    setUsersPage(1)
  }

  const handleAddAlumno = async (authId: string) => {
    setAdding(authId)
    setMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/alumnos", {
        method: "POST",
        headers,
        body: JSON.stringify({ auth_id: authId }),
      })
      const json = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Alumno agregado correctamente" })
        fetchAlumnos()
        fetchUsers(usersPage, usersSearch)
      } else {
        setMessage({ type: "error", text: json.error || "Error al agregar alumno" })
      }
    } catch {
      setMessage({ type: "error", text: "Error al agregar alumno" })
    } finally {
      setAdding(null)
    }
  }

  const handleDeleteAlumno = async (authId: string) => {
    setMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/alumnos/${authId}`, {
        method: "DELETE",
        headers,
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Alumno eliminado correctamente" })
        fetchAlumnos()
      } else {
        const json = await res.json()
        setMessage({ type: "error", text: json.error || "Error al eliminar alumno" })
      }
    } catch {
      setMessage({ type: "error", text: "Error al eliminar alumno" })
    }
  }

  const alumnoIds = new Set(alumnos.map((a) => a.auth_id))
  const availableUsers = users.filter((u) => !alumnoIds.has(u.id))
  const totalPages = Math.ceil(usersTotal / PER_PAGE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-terracotta">Alumnos</h1>
        <p className="text-muted-foreground">
          Gestionar alumnos de la escuela. Los alumnos pueden acceder a documentos protegidos de la sección Escuela.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Add alumno - paginated user list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar alumno
          </CardTitle>
          <CardDescription>Usuarios más recientes. Buscá por nombre, email o club para filtrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nombre, email o club..."
                value={usersSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-terracotta" />
            </div>
          ) : availableUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {usersSearch.trim().length >= 3
                ? "No se encontraron usuarios con esa búsqueda."
                : "No hay usuarios disponibles para agregar."}
            </p>
          ) : (
            <div className="border rounded-md divide-y">
              {availableUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2.5 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                      {user.club_name && <span className="ml-2 text-terracotta">({user.club_name})</span>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddAlumno(user.id)}
                    disabled={adding === user.id}
                    className="bg-terracotta hover:bg-terracotta/90 ml-2 shrink-0"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                Página {usersPage} de {totalPages} ({usersTotal} usuarios)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  disabled={usersPage <= 1 || usersLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUsersPage((p) => Math.min(totalPages, p + 1))}
                  disabled={usersPage >= totalPages || usersLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alumnos list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Alumnos actuales ({alumnos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
            </div>
          ) : alumnos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay alumnos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos.map((alumno) => (
                  <TableRow key={alumno.auth_id}>
                    <TableCell className="font-medium">
                      {alumno.nombre} {alumno.apellido}
                    </TableCell>
                    <TableCell>{alumno.email}</TableCell>
                    <TableCell>{formatArgentinaDate(alumno.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar alumno</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que querés eliminar a {alumno.nombre} {alumno.apellido} como alumno?
                              Ya no podrá acceder a los documentos de la Escuela.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAlumno(alumno.auth_id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
