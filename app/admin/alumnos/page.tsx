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
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function AdminAlumnosPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; nombre: string; apellido: string }>>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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

  useEffect(() => {
    fetchAlumnos()
  }, [fetchAlumnos])

  const handleSearch = async () => {
    if (!searchEmail.trim() || searchEmail.trim().length < 3) return
    setSearching(true)
    setSearchResults([])
    try {
      const headers = await getAuthHeaders()
      // Use the existing users search endpoint
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchEmail.trim())}`, { headers })
      if (res.ok) {
        const json = await res.json()
        const users = json.data?.users || json.users || []
        // Filter out users already in alumnos
        const alumnoIds = new Set(alumnos.map((a) => a.auth_id))
        setSearchResults(
          users
            .filter((u: any) => u.id && !alumnoIds.has(u.id))
            .map((u: any) => ({
              id: u.id,
              email: u.email || "",
              nombre: u.user_metadata?.nombre || "",
              apellido: u.user_metadata?.apellido || "",
            }))
        )
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddAlumno = async (authId: string) => {
    setAdding(true)
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
        setSearchEmail("")
        setSearchResults([])
        fetchAlumnos()
      } else {
        setMessage({ type: "error", text: json.error || "Error al agregar alumno" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error al agregar alumno" })
    } finally {
      setAdding(false)
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
    } catch (error) {
      setMessage({ type: "error", text: "Error al eliminar alumno" })
    }
  }

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

      {/* Add alumno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar alumno
          </CardTitle>
          <CardDescription>Buscá un usuario por email para agregarlo como alumno</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-email" className="sr-only">
                Email del usuario
              </Label>
              <Input
                id="search-email"
                placeholder="Buscar por email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || searchEmail.trim().length < 3}
              className="bg-terracotta hover:bg-terracotta/90"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-md divide-y">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddAlumno(user.id)}
                    disabled={adding}
                    className="bg-terracotta hover:bg-terracotta/90"
                  >
                    {adding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searching === false && searchEmail.trim().length >= 3 && searchResults.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No se encontraron usuarios disponibles con ese email.
            </p>
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
