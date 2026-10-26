"use client"

import { useState } from "react"
import { BadgeCheck, Building2, ChevronDown, GraduationCap, Search, Shield, ShieldCheck, Trash2, User } from "lucide-react"
import { toast } from "sonner"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions, type AdminRowAction } from "@/components/admin-row-actions"
import { AdminSortIcon } from "@/components/admin-sort-icon"
import { InfoPill } from "@/components/info-pill"
import { apiCall } from "@/lib/utils/apiClient"

interface UserWithPermissions {
  id: string
  email: string
  emailVerified: boolean
  lastSignIn: string | null
  createdAt: string
  nombre?: string
  apellido?: string
  telefono?: string | null
  direccion?: string | null
  fecha_nacimiento?: string | null
  isAdmin: boolean
  isClubAdmin: boolean
  isAlumno: boolean
  adminClubs: string[]
}

type RoleFilter = "all" | "admin" | "club_admin" | "alumno" | "user" | "verified"
type SortField = "email" | "name" | "role" | "clubs" | "verified"

const ROLE_FILTERS: Record<RoleFilter, (user: UserWithPermissions) => boolean> = {
  all: () => true,
  admin: (user) => user.isAdmin,
  club_admin: (user) => user.isClubAdmin,
  alumno: (user) => user.isAlumno,
  user: (user) => !user.isAdmin && !user.isClubAdmin,
  verified: (user) => user.emailVerified,
}

const SORT_LABELS: Record<SortField, string> = {
  email: "Email",
  name: "Nombre",
  role: "Rol",
  clubs: "Clubes",
  verified: "Verificación",
}

const fullName = (user: UserWithPermissions) =>
  [user.nombre, user.apellido].filter(Boolean).join(" ")

function RolePills({ user }: { user: UserWithPermissions }) {
  return (
    <div className="flex flex-wrap gap-1">
      {user.isAdmin && <InfoPill icon={ShieldCheck}>Admin</InfoPill>}
      {user.isClubAdmin && <InfoPill icon={Building2}>Delegado</InfoPill>}
      {user.isAlumno && <InfoPill icon={GraduationCap}>Alumno</InfoPill>}
      {!user.isAdmin && !user.isClubAdmin && !user.isAlumno && <InfoPill icon={User}>Usuario</InfoPill>}
    </div>
  )
}

function VerifiedIcon() {
  return (
    <span title="Email verificado" className="shrink-0">
      <BadgeCheck className="h-4 w-4 text-amber" aria-label="Email verificado" />
    </span>
  )
}

interface UsersTableProps {
  initialUsers: UserWithPermissions[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [users, setUsers] = useState<UserWithPermissions[]>(initialUsers)
  const [sortBy, setSortBy] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [userToDelete, setUserToDelete] = useState<UserWithPermissions | null>(null)
  const [userToAlumno, setUserToAlumno] = useState<UserWithPermissions | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsPending(true)
    try {
      await apiCall(`/api/auth/users/${userToDelete.id}`, { method: "DELETE" })
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
      toast.success("Usuario eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el usuario")
    } finally {
      setIsPending(false)
      setUserToDelete(null)
    }
  }

  const handleAddAlumno = async () => {
    if (!userToAlumno) return
    setIsPending(true)
    try {
      await apiCall("/api/admin/alumnos", {
        method: "POST",
        body: JSON.stringify({ auth_id: userToAlumno.id }),
      })
      setUsers((prev) =>
        prev.map((user) => (user.id === userToAlumno.id ? { ...user, isAlumno: true } : user))
      )
      toast.success(`${userToAlumno.email} ahora es alumno`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar alumno")
    } finally {
      setIsPending(false)
      setUserToAlumno(null)
    }
  }

  // Cycle: asc -> desc -> original
  const handleSort = (field: SortField) => {
    if (sortBy !== field) {
      setSortBy(field)
      setSortOrder("asc")
    } else if (sortOrder === "asc") {
      setSortOrder("desc")
    } else {
      setSortBy(null)
    }
  }

  const sortDirection = (field: SortField) => (sortBy === field ? sortOrder : null)

  const sortValue = (user: UserWithPermissions, field: SortField): string | number => {
    switch (field) {
      case "email":
        return user.email.toLowerCase()
      case "name":
        return (fullName(user) || user.email).toLowerCase()
      case "role":
        return user.isAdmin ? 2 : user.isClubAdmin ? 1 : 0
      case "clubs":
        return user.adminClubs.length
      case "verified":
        return user.emailVerified ? 1 : 0
    }
  }

  const query = searchQuery.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    if (!ROLE_FILTERS[roleFilter](user)) return false
    if (!query) return true
    return (
      user.email.toLowerCase().includes(query) ||
      (user.nombre || "").toLowerCase().includes(query) ||
      (user.apellido || "").toLowerCase().includes(query) ||
      user.adminClubs.some((club) => club.toLowerCase().includes(query))
    )
  })

  const sortedAndFilteredUsers = sortBy
    ? [...filteredUsers].sort((a, b) => {
        const aValue = sortValue(a, sortBy)
        const bValue = sortValue(b, sortBy)
        if (aValue === bValue) return 0
        return (aValue < bValue ? -1 : 1) * (sortOrder === "asc" ? 1 : -1)
      })
    : filteredUsers

  const isFiltered = query !== "" || roleFilter !== "all"
  const emptyText = isFiltered ? "No se encontraron usuarios" : "No hay usuarios registrados"

  const rowActions = (user: UserWithPermissions): AdminRowAction[] => [
    { label: "Editar permisos", icon: Shield, href: `/admin/usuarios/${user.id}/editar` },
    {
      label: "Hacer alumno",
      icon: GraduationCap,
      onSelect: () => setUserToAlumno(user),
      hidden: user.isAlumno,
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onSelect: () => setUserToDelete(user),
      destructive: true,
    },
  ]

  const sortableHead = (field: SortField, label: string, className?: string) => (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap hover:bg-muted/50 ${className ?? ""}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <AdminSortIcon direction={sortDirection(field)} />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido, email o club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
            <SelectTrigger className="w-full md:w-[180px]" aria-label="Filtrar por rol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="club_admin">Delegados</SelectItem>
              <SelectItem value="alumno">Alumnos</SelectItem>
              <SelectItem value="user">Usuarios básicos</SelectItem>
              <SelectItem value="verified">Email verificado</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                {sortBy ? SORT_LABELS[sortBy] : "Ordenar"}
                <AdminSortIcon direction={sortBy ? sortOrder : null} />
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <DropdownMenuItem key={field} onClick={() => handleSort(field)} className="justify-between">
                  {SORT_LABELS[field]}
                  <AdminSortIcon direction={sortDirection(field)} />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy(null)}>Orden original</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {sortableHead("email", "Email")}
              {sortableHead("name", "Nombre")}
              {sortableHead("role", "Roles")}
              {sortableHead("clubs", "Clubes administrados", "hidden lg:table-cell")}
              <TableHead className="w-[60px]">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="break-all">{user.email}</span>
                      {user.emailVerified && <VerifiedIcon />}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {fullName(user) || <span className="italic text-muted-foreground">Sin nombre</span>}
                  </TableCell>
                  <TableCell>
                    <RolePills user={user} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.adminClubs.length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {user.adminClubs.slice(0, 2).map((club, index) => (
                          <div key={index}>{club}</div>
                        ))}
                        {user.adminClubs.length > 2 && (
                          <div className="text-xs">+{user.adminClubs.length - 2} más</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminRowActions actions={rowActions(user)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {sortedAndFilteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{emptyText}</div>
        ) : (
          sortedAndFilteredUsers.map((user) => (
            <div key={user.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{fullName(user) || "Sin nombre"}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="truncate">{user.email}</span>
                    {user.emailVerified && <VerifiedIcon />}
                  </div>
                </div>
                <AdminRowActions actions={rowActions(user)} />
              </div>
              <RolePills user={user} />
              {user.adminClubs.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-amber" />
                  <span className="truncate">{user.adminClubs.join(", ")}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {sortedAndFilteredUsers.length} de {users.length} usuarios
      </div>

      <AdminConfirmDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="¿Eliminar usuario?"
        description={userToDelete ? `Se eliminará ${userToDelete.email}. Esta acción no se puede deshacer.` : undefined}
        onConfirm={handleDeleteUser}
        pending={isPending}
      />

      <AdminConfirmDialog
        open={userToAlumno !== null}
        onOpenChange={(open) => !open && setUserToAlumno(null)}
        title="¿Hacer alumno?"
        description={userToAlumno ? `${userToAlumno.email} podrá acceder a los documentos de la escuela.` : undefined}
        confirmLabel="Hacer alumno"
        onConfirm={handleAddAlumno}
        pending={isPending}
        destructive={false}
      />
    </div>
  )
}
