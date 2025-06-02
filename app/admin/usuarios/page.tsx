"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

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

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load users on component mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        setError(null)
        const usersData = await fetchAllUsers()
        setUsers(usersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar los usuarios")
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.apellido || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.adminClubs.some(club => club.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar usuarios"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-0 w-full md:w-auto">Email</TableHead>
                <TableHead className="whitespace-nowrap">Roles</TableHead>
                <TableHead className="hidden md:table-cell">Clubes Administrados</TableHead>
                <TableHead className="w-[50px] md:w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground md:table-cell">
                    {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </TableCell>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground md:hidden">
                    {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
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
                            <Link href={`/admin/usuarios/${user.id}`} className="flex w-full">
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/admin/usuarios/${user.id}/editar`} className="flex w-full">
                              Editar permisos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" disabled>
                            Gestionar acceso
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
        Mostrando {filteredUsers.length} de {users.length} usuarios registrados
      </div>
    </div>
  )
}

