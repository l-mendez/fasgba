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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <div className="flex items-center space-x-2">
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar usuarios por email, nombre o club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Clubes Administrados</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">
                      {user.nombre && user.apellido ? 
                        `${user.nombre} ${user.apellido}` : 
                        user.nombre || 'Usuario'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {user.id.substring(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{user.email}</div>
                    {user.emailVerified && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 mt-1">
                        Verificado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.isAdmin && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Admin Global
                        </span>
                      )}
                      {user.isClubAdmin && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Admin Club
                        </span>
                      )}
                      {!user.isAdmin && !user.isClubAdmin && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Usuario
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
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
      
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {users.length} usuarios registrados
      </div>
    </div>
  )
}

