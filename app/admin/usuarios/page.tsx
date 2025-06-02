"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Search } from "lucide-react"

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
import { supabase } from "@/lib/supabaseClient"

// Updated interface to include additional user metadata
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
  adminClubs: string[]
}

// API utility functions
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

// Updated function to fetch all users from Supabase Auth
async function fetchAllUsers(): Promise<UserWithPermissions[]> {
  try {
    // First, check if we can access the admin functionality
    const debugInfo = await apiCall('/api/auth/debug')
    
    if (!debugInfo.isAdmin) {
      throw new Error('No tienes permisos de administrador para ver esta información')
    }

    // Use the new endpoint to fetch all users from Supabase Auth
    const users = await apiCall('/api/auth/users')
    
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

// Add delete user function
async function deleteUser(userId: string): Promise<void> {
  try {
    await apiCall(`/api/auth/users/${userId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<UserWithPermissions[]>([])
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Load users on component mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        setError(null)
        const usersData = await fetchAllUsers()
        setUsers(usersData)
        setOriginalOrder(usersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los usuarios")
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Add delete user handler
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setIsDeleting(userId)
      await deleteUser(userId)
      
      // Update the users list by removing the deleted user
      const updatedUsers = users.filter(user => user.id !== userId)
      setUsers(updatedUsers)
      setOriginalOrder(updatedUsers)
      
      // Show success message (you could replace this with a toast notification)
      alert('Usuario eliminado correctamente')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar el usuario')
    } finally {
      setIsDeleting(null)
    }
  }

  // Sorting functions
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Cycle through: asc -> desc -> original
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder('original')
        setSortBy(null)
      }
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortedUsers = (usersToSort: UserWithPermissions[]) => {
    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(user => 
        usersToSort.some(filtered => filtered.id === user.id)
      )
    }

    const sorted = [...usersToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'role':
          // Sort by role hierarchy: Admin > Club Admin > User
          aValue = a.isAdmin ? 2 : (a.isClubAdmin ? 1 : 0)
          bValue = b.isAdmin ? 2 : (b.isClubAdmin ? 1 : 0)
          break
        case 'clubs':
          aValue = a.adminClubs.length
          bValue = b.adminClubs.length
          break
        case 'verified':
          aValue = a.emailVerified ? 1 : 0
          bValue = b.emailVerified ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return null
    }
    
    if (sortOrder === 'asc') {
      return '↑'
    } else if (sortOrder === 'desc') {
      return '↓'
    }
    
    return null
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.apellido || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.adminClubs.some(club => club.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Apply sorting to filtered users
  const sortedAndFilteredUsers = getSortedUsers(filteredUsers)

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Usuarios</h2>
        <div className="flex items-center space-x-2">
        </div>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filtrar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSearchQuery("")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery("Admin")}>Administradores</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery("Delegado")}>Delegados</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery("Usuario")}>Usuarios básicos</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSearchQuery("Verificado")}>Email verificado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Ordenar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort('email')}>
                Email {getSortIcon('email')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('role')}>
                Rol {getSortIcon('role')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('clubs')}>
                Clubes {getSortIcon('clubs')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('verified')}>
                Verificación {getSortIcon('verified')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSortBy(null)
                setSortOrder('original')
              }}>
                Orden original
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="min-w-0 w-full md:w-auto cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1">
                    Email
                    {getSortIcon('email') && <span className="text-xs">{getSortIcon('email')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Roles
                    {getSortIcon('role') && <span className="text-xs">{getSortIcon('role')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('clubs')}
                >
                  <div className="flex items-center gap-1">
                    Clubes Administrados
                    {getSortIcon('clubs') && <span className="text-xs">{getSortIcon('clubs')}</span>}
                  </div>
                </TableHead>
                <TableHead className="w-[50px] md:w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground md:table-cell">
                    {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </TableCell>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground md:hidden">
                    {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-0 max-w-0 md:min-w-auto md:max-w-none">
                      <div className="truncate pr-2 md:pr-0">{user.email}</div>
                      {user.emailVerified && (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-100 mt-1">
                          <span className="md:hidden">✓</span>
                          <span className="hidden md:inline">Verificado</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-center md:items-start md:flex-row md:flex-wrap">
                        {user.isAdmin && (
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900 px-2 md:px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-100">
                            <span className="md:hidden">Admin</span>
                            <span className="hidden md:inline">Admin</span>
                          </span>
                        )}
                        {user.isClubAdmin && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 md:px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                            <span className="md:hidden">Delegado</span>
                            <span className="hidden md:inline">Delegado</span>
                          </span>
                        )}
                        {!user.isAdmin && !user.isClubAdmin && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 md:px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-100">
                            Usuario
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.adminClubs.length > 0 ? (
                        <div className="text-sm">
                          {user.adminClubs.slice(0, 2).map((club, index) => (
                            <div key={index} className="text-muted-foreground">
                              {club}
                            </div>
                          ))}
                          {user.adminClubs.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{user.adminClubs.length - 2} más
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Link href={`/admin/usuarios/${user.id}/editar`} className="flex w-full">
                              Editar permisos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isDeleting === user.id}
                          >
                            {isDeleting === user.id ? 'Eliminando...' : 'Eliminar usuario'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Mostrando {sortedAndFilteredUsers.length} de {users.length} usuarios registrados
      </div>
    </div>
  )
}

