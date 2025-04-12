"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, Key, MoreHorizontal, Plus, Search, Shield, Trash2 } from "lucide-react"

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
import { supabase } from "@/lib/supabaseClient"

interface User {
  id: number
  name: string
  surname: string
  email: string
  profile_picture: string | null
  club_id: number | null
  club: {
    id: number
    name: string
  } | null
  page_admin: boolean
  birth_date: string
}

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  club: string
  fechaRegistro: string
  estado: string
  avatar: string
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            surname,
            email,
            profile_picture,
            club_id,
            club:club_id(id, name),
            page_admin,
            birth_date
          `)
          .order('id')

        if (usersError) throw usersError

        // Transform the data to match our UI format
        const transformedUsers: Usuario[] = (users || []).map((user: any) => ({
          id: user.id,
          nombre: `${user.name} ${user.surname}`,
          email: user.email,
          rol: user.page_admin ? "administrador" : "jugador", // You might want to add a role field to your users table
          club: user.club?.name || "Sin club",
          fechaRegistro: new Date(user.birth_date).toLocaleDateString('es-AR'),
          estado: "activo", // You might want to add an active field to your users table
          avatar: user.profile_picture || "/placeholder.svg?height=40&width=40"
        }))

        setUsuarios(transformedUsers)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los usuarios")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filtrar usuarios según término de búsqueda
  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.club.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para eliminar un usuario
  const handleDeleteUsuario = async () => {
    if (!usuarioToDelete) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', usuarioToDelete)

      if (error) throw error

      setUsuarios(usuarios.filter((usuario) => usuario.id !== usuarioToDelete))
      setShowDeleteDialog(false)
      setUsuarioToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el usuario")
    }
  }

  // Función para resetear contraseña
  const handleResetPassword = () => {
    // Aquí iría la lógica para resetear la contraseña
    setShowResetPasswordDialog(false)
    setSelectedUsuario(null)
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema.</p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, email, rol o club..."
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
            <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("administrador")}>Administradores</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("jugador")}>Jugadores</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Cargando usuarios...</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Fecha de nacimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuario.avatar} alt={usuario.nombre} />
                        <AvatarFallback className="bg-amber/10 text-amber-dark">
                          {usuario.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        usuario.rol === "administrador"
                          ? "border-amber bg-amber/10 text-amber-dark"
                          : "border-gray-500 bg-gray-500/10 text-gray-500"
                      }
                    >
                      {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{usuario.club}</TableCell>
                  <TableCell>{usuario.fechaRegistro}</TableCell>
                  <TableCell>
                    <Badge
                      variant={usuario.estado === "activo" ? "default" : "outline"}
                      className={
                        usuario.estado === "activo" ? "bg-green-500 hover:bg-green-500/80" : "text-muted-foreground"
                      }
                    >
                      {usuario.estado === "activo" ? "Activo" : "Inactivo"}
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
                          <Link href={`/admin/usuarios/${usuario.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/usuarios/${usuario.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUsuario(usuario)
                            setShowResetPasswordDialog(true)
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Resetear contraseña
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setUsuarioToDelete(usuario.id)
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
        )}
      </div>

      {/* Diálogo de confirmación para eliminar usuario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUsuario}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para resetear contraseña */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas resetear la contraseña de {selectedUsuario?.nombre}? Se enviará un email con
              instrucciones para crear una nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>Resetear contraseña</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

