"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Download, Filter, Search, SortAsc, Trash2, UserPlus } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useClubContext } from "../context/club-context"

// Definir tipo para miembros que obtenemos de la base de datos
type Miembro = {
  id: number
  name: string
  surname: string
  email: string
  birth_date: string
  birth_gender: string
  profile_picture: string | null
  club_id: number
  active: boolean
  // Datos calculados
  estado: string
  categoria: string
  elo: number
  fechaRegistro: string
}

// Tipos para filtros
type StatusFilter = 'todos' | 'activos' | 'inactivos'
type CategoryFilter = 'todas' | 'adulto' | 'juvenil' | 'infantil'
type SortOption = 'nombre-asc' | 'nombre-desc' | 'elo-desc' | 'elo-asc' | 'fecha-desc' | 'fecha-asc'

export default function MiembrosPage() {
  const { selectedClub, isLoading: isClubLoading } = useClubContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('todas')
  const [sortOption, setSortOption] = useState<SortOption>('nombre-asc')

  // Inicializar cliente de Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cargar miembros del club seleccionado
  useEffect(() => {
    async function fetchMiembros() {
      if (!selectedClub) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        console.log('Fetching members for club:', selectedClub.id)

        // Consultar usuarios que pertenecen al club seleccionado
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            surname,
            email,
            birth_date,
            birth_gender,
            profile_picture,
            club_id,
            active
          `)
          .eq('club_id', selectedClub.id)

        if (error) {
          console.error('Error fetching users:', error)
          throw new Error(`Error fetching users: ${error.message}`)
        }

        console.log('Found members:', data?.length)

        // Verificar si hay datos
        if (!data || data.length === 0) {
          setMiembros([])
          setIsLoading(false)
          return
        }

        // Obtener datos de ELO para cada usuario (última entrada)
        try {
          const miembrosConElo = await Promise.all(
            data.map(async (miembro) => {
              try {
                // Calcular categoría basada en edad
                const fechaNac = new Date(miembro.birth_date)
                const hoy = new Date()
                const edad = hoy.getFullYear() - fechaNac.getFullYear()
                
                let categoria = 'Adulto'
                if (edad < 18) categoria = 'Juvenil'
                if (edad < 12) categoria = 'Infantil'

                // Formato de fecha de registro amigable
                const fechaRegistro = new Date(miembro.birth_date).toLocaleDateString('es-ES')

                // Buscar datos de ELO
                const { data: eloData, error: eloError } = await supabase
                  .from('elohistory')
                  .select('elo, recorded_at')
                  .eq('user_id', miembro.id)
                  .order('recorded_at', { ascending: false })
                  .limit(1)
                
                if (eloError) {
                  console.error(`Error fetching ELO for member ${miembro.id}:`, eloError)
                }

                // Usar el valor de active de la base de datos
                const estado = miembro.active !== undefined ? (miembro.active ? 'Activo' : 'Inactivo') : 'Activo'

                return {
                  ...miembro,
                  elo: eloData?.[0]?.elo || 0,
                  categoria,
                  estado,
                  fechaRegistro
                }
              } catch (memberError) {
                console.error(`Error processing member ${miembro.id}:`, memberError)
                // Return the member with default values instead of failing the whole process
                return {
                  ...miembro,
                  elo: 0,
                  categoria: 'Adulto',
                  estado: miembro.active !== undefined ? (miembro.active ? 'Activo' : 'Inactivo') : 'Activo',
                  fechaRegistro: new Date(miembro.birth_date).toLocaleDateString('es-ES')
                }
              }
            })
          )

          setMiembros(miembrosConElo)
        } catch (processError: unknown) {
          console.error('Error processing members data:', processError)
          throw new Error(`Error processing members data: ${processError instanceof Error ? processError.message : String(processError)}`)
        }
      } catch (err) {
        console.error('Error al cargar miembros:', err instanceof Error ? err.message : JSON.stringify(err))
        setError('Ocurrió un error al cargar los miembros del club')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMiembros()
  }, [selectedClub, supabase])

  // Aplicar filtros y búsqueda
  const filteredMiembros = miembros
    // Filtro por texto de búsqueda
    .filter(miembro => 
      `${miembro.name} ${miembro.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // Filtro por estado
    .filter(miembro => {
      if (statusFilter === 'todos') return true
      if (statusFilter === 'activos') return miembro.active === true
      if (statusFilter === 'inactivos') return miembro.active === false
      return true
    })
    // Filtro por categoría
    .filter(miembro => {
      if (categoryFilter === 'todas') return true
      return miembro.categoria.toLowerCase() === categoryFilter
    })
    // Ordenamiento
    .sort((a, b) => {
      switch (sortOption) {
        case 'nombre-asc':
          return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
        case 'nombre-desc':
          return `${b.name} ${b.surname}`.localeCompare(`${a.name} ${a.surname}`)
        case 'elo-desc':
          return b.elo - a.elo
        case 'elo-asc':
          return a.elo - b.elo
        case 'fecha-desc':
          return new Date(b.birth_date).getTime() - new Date(a.birth_date).getTime()
        case 'fecha-asc':
          return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime()
        default:
          return 0
      }
    })

  // Renderizar estado de carga o error
  if (isClubLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-4rem)]">
        <div className="text-lg font-medium text-muted-foreground">Cargando información del club...</div>
      </div>
    )
  }

  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-4rem)]">
        <div className="text-xl font-medium text-muted-foreground">No administras ningún club</div>
        <p className="mt-2 text-sm text-muted-foreground">Contacta con FASGBA para solicitar acceso como administrador</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Miembros del Club</h1>
          <p className="text-muted-foreground">Administra los miembros de {selectedClub.nombre}</p>
        </div>
        <Button asChild>
          <Link href="/club-admin/miembros/nuevo">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Miembro
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar miembros..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'todos'}
                onCheckedChange={() => setStatusFilter('todos')}
              >
                Todos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'activos'}
                onCheckedChange={() => setStatusFilter('activos')}
              >
                Activos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'inactivos'}
                onCheckedChange={() => setStatusFilter('inactivos')}
              >
                Inactivos
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Categoría</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={categoryFilter === 'todas'}
                onCheckedChange={() => setCategoryFilter('todas')}
              >
                Todas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={categoryFilter === 'adulto'}
                onCheckedChange={() => setCategoryFilter('adulto')}
              >
                Adulto
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={categoryFilter === 'juvenil'}
                onCheckedChange={() => setCategoryFilter('juvenil')}
              >
                Juvenil
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={categoryFilter === 'infantil'}
                onCheckedChange={() => setCategoryFilter('infantil')}
              >
                Infantil
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <SortAsc className="h-4 w-4" />
                <span className="sr-only">Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortOption('nombre-asc')}
                className={sortOption === 'nombre-asc' ? 'bg-muted' : ''}
              >
                Nombre (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption('nombre-desc')}
                className={sortOption === 'nombre-desc' ? 'bg-muted' : ''}
              >
                Nombre (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption('elo-desc')}
                className={sortOption === 'elo-desc' ? 'bg-muted' : ''}
              >
                ELO (Mayor a menor)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption('elo-asc')}
                className={sortOption === 'elo-asc' ? 'bg-muted' : ''}
              >
                ELO (Menor a mayor)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption('fecha-desc')}
                className={sortOption === 'fecha-desc' ? 'bg-muted' : ''}
              >
                Fecha de registro (Más reciente)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortOption('fecha-asc')}
                className={sortOption === 'fecha-asc' ? 'bg-muted' : ''}
              >
                Fecha de registro (Más antiguo)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Exportar</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando miembros del club...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ELO</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMiembros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMiembros.map((miembro) => (
                    <TableRow key={miembro.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={miembro.profile_picture || "/placeholder.svg?height=40&width=40"} alt={`${miembro.name} ${miembro.surname}`} />
                            <AvatarFallback className="bg-amber/10 text-amber-dark">
                              {`${miembro.name} ${miembro.surname}`
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{`${miembro.name} ${miembro.surname}`}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{miembro.email}</TableCell>
                      <TableCell>{miembro.elo}</TableCell>
                      <TableCell>{miembro.categoria}</TableCell>
                      <TableCell>
                        <Badge
                          variant={miembro.estado === "Activo" ? "outline" : "secondary"}
                          className={
                            miembro.estado === "Activo" ? "text-green-500 bg-green-50" : "text-red-500 bg-red-50"
                          }
                        >
                          {miembro.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{miembro.fechaRegistro}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/club-admin/miembros/${miembro.id}`}>Ver detalles</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/club-admin/miembros/${miembro.id}/editar`}>Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
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
        )}
      </div>
    </div>
  )
}

