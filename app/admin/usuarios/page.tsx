"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MoreHorizontal, Plus, Search, Trash, UserPlus } from "lucide-react"

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

// Mock data for users
const mockUsers = [
  {
    id: 1,
    name: "Juan",
    surname: "Pérez",
    email: "juan.perez@example.com",
    club: "Club de Ajedrez Buenos Aires",
    role: "Usuario",
  },
  {
    id: 2,
    name: "María",
    surname: "González",
    email: "maria.gonzalez@example.com",
    club: "Club de Ajedrez La Plata",
    role: "Admin",
  },
  {
    id: 3,
    name: "Carlos",
    surname: "Rodríguez",
    email: "carlos.rodriguez@example.com",
    club: "Club de Ajedrez Rosario",
    role: "Usuario",
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users] = useState(mockUsers)

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/admin/usuarios/nuevo">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo usuario
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name} {user.surname}</div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.club}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
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
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

