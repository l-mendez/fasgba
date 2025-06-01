"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useClubContext } from "../context/club-context"

// Define el tipo para noticias según la nueva API
interface NewsDisplay {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[] | null
  club_id: number | null
  created_by_auth_id: string
  created_at: string
  updated_at: string
  // Relaciones incluidas por la API
  club?: {
    id: number
    name: string
    address: string | null
    telephone: string | null
    mail: string | null
    schedule: string | null
  }
  // Campos calculados localmente
  estado: 'publicada' | 'borrador'
  fecha_formateada: string
  autor: string
  categoria: string
}

// Helper function para hacer llamadas a la API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const url = `/api${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
  }
  
  if (response.status === 204) {
    return null // No content
  }
  
  return response.json()
}

export default function ClubAdminNoticiasPage() {
  const { selectedClub } = useClubContext()
  const [noticias, setNoticias] = useState<NewsDisplay[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [noticiaToDelete, setNoticiaToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cargar noticias del club seleccionado usando la nueva API
  useEffect(() => {
    async function fetchNoticias() {
      if (!selectedClub) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching news for club:', selectedClub.id)
        
        // Usar la nueva API para obtener noticias del club
        const response = await apiCall(`/news?clubId=${selectedClub.id}&include=author,club&limit=100&orderBy=created_at&order=desc`)
        
        console.log('API response:', response)
        
        const newsData = response.news || []
        
        console.log('Found news:', newsData.length)
        
        // Procesar los datos para el formato que necesitamos
        const processedNoticias: NewsDisplay[] = newsData.map((noticia: any) => {
          // Determinar la categoría basada en tags, o 'General' si no hay tags
          const categoria = noticia.tags && noticia.tags.length > 0 
            ? noticia.tags[0] 
            : 'General'
          
          // Formatear fecha de manera amigable
          const fecha = new Date(noticia.date || noticia.created_at)
          const fecha_formateada = fecha.toLocaleDateString('es-ES')
          
          // Nombre del autor (ahora viene del auth, podríamos necesitar obtenerlo de otra manera)
          // Por ahora usamos el auth_id o un placeholder
          // TODO: Mejorar mostrando el nombre real del usuario desde el metadata de auth
          const autor = noticia.created_by_auth_id ? 
            `Usuario ${noticia.created_by_auth_id.substring(0, 8)}...` : 
            'Autor desconocido'
          
          // Estado de la noticia (por ahora todas publicadas)
          const estado = 'publicada'
          
          return {
            ...noticia,
            fecha_formateada,
            autor,
            categoria,
            estado
          }
        })
        
        setNoticias(processedNoticias)
      } catch (err) {
        console.error('Error al cargar noticias:', err instanceof Error ? err.message : JSON.stringify(err))
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar las noticias del club')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchNoticias()
  }, [selectedClub])

  // Filtrar noticias según término de búsqueda
  const filteredNoticias = noticias.filter(
    (noticia) =>
      noticia.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      noticia.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      noticia.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Función para eliminar una noticia usando la nueva API
  const handleDeleteNoticia = async () => {
    if (!noticiaToDelete) return
    
    try {
      await apiCall(`/news/${noticiaToDelete}`, { method: 'DELETE' })
      
      // Actualizar el estado local
      setNoticias(noticias.filter((noticia) => noticia.id !== noticiaToDelete))
      setShowDeleteDialog(false)
      setNoticiaToDelete(null)
    } catch (err) {
      console.error('Error al eliminar noticia:', err)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al eliminar la noticia')
    }
  }

  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-4rem)]">
        <div className="text-xl font-medium text-muted-foreground">No hay un club seleccionado</div>
        <p className="mt-2 text-sm text-muted-foreground">Por favor, selecciona un club antes de administrar noticias</p>
        <Button className="mt-4" asChild>
          <Link href="/club-admin">Volver al dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Noticias</h1>
          <p className="text-muted-foreground">Gestiona las noticias publicadas por {selectedClub.name}.</p>
        </div>
        <Button asChild>
          <Link href="/club-admin/noticias/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Noticia
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, autor o categoría..."
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
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>Todas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("publicada")}>Publicadas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("borrador")}>Borradores</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Cargando noticias del club...
        </div>
      ) : filteredNoticias.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No se encontraron noticias que coincidan con los criterios de búsqueda.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNoticias.map((noticia) => (
                <TableRow key={noticia.id}>
                  <TableCell className="font-medium">{noticia.title}</TableCell>
                  <TableCell>{noticia.autor}</TableCell>
                  <TableCell>{noticia.fecha_formateada}</TableCell>
                  <TableCell>{noticia.categoria}</TableCell>
                  <TableCell>
                    <Badge
                      variant={noticia.estado === "publicada" ? "default" : "outline"}
                      className={
                        noticia.estado === "publicada" ? "bg-green-500 hover:bg-green-500/80" : "text-muted-foreground"
                      }
                    >
                      {noticia.estado === "publicada" ? "Publicada" : "Borrador"}
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
                          <Link href={`/noticias/${noticia.id}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver en sitio
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/club-admin/noticias/${noticia.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setNoticiaToDelete(noticia.id)
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
        </div>
      )}

      {/* Diálogo de confirmación para eliminar noticia */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteNoticia}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

