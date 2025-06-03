"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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

// Define el tipo para noticias según la API
interface ClubNews {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[]
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
  author_name?: string
  author_email?: string
}

// Helper function para hacer llamadas a la API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
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

// Helper functions for data processing
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return 'Fecha inválida'
  }
}

const getAuthorName = (news: ClubNews) => {
  return news.author_name || news.author_email || 'Autor desconocido'
}

const getNewsCategory = (news: ClubNews) => {
  if (news.tags && news.tags.length > 0) {
    return news.tags[0].charAt(0).toUpperCase() + news.tags[0].slice(1)
  }
  return 'General'
}

const getNewsStatus = (news: ClubNews) => {
  // For now, we'll consider all news as published since we don't have a status field
  // In the future, this could be based on a publication date or status field
  return 'publicada'
}

// Get date for sorting (use the news date)
const getNewsSortDate = (news: ClubNews): Date => {
  return new Date(news.date)
}

// Get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "publicada":
      return "default"
    case "borrador":
      return "outline"
    default:
      return "outline"
  }
}

// Get status badge class
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "publicada":
      return "bg-green-500 hover:bg-green-500/80"
    case "borrador":
      return "text-muted-foreground"
    default:
      return ""
  }
}

// Get status display text
const getStatusText = (status: string) => {
  switch (status) {
    case "publicada":
      return "Publicada"
    case "borrador":
      return "Borrador"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export default function ClubAdminNoticiasPage() {
  const { selectedClub, isLoading: clubsLoading, hasNoClubs } = useClubContext()
  const [noticias, setNoticias] = useState<ClubNews[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [noticiaToDelete, setNoticiaToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<ClubNews[]>([])
  
  // Check for unauthorized access once clubs are loaded
  useEffect(() => {
    if (!clubsLoading && hasNoClubs) {
      notFound()
    }
  }, [clubsLoading, hasNoClubs])
  
  // Cargar noticias del club seleccionado usando la API
  const loadNews = async () => {
    if (!selectedClub) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const newsData = await apiCall(`/clubs/${selectedClub.id}/news`)
      
      if (newsData && Array.isArray(newsData)) {
        setNoticias(newsData)
        setOriginalOrder(newsData)
      } else {
        setNoticias([])
        setOriginalOrder([])
      }
    } catch (err) {
      console.error('Error loading news:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar las noticias')
      setNoticias([])
      setOriginalOrder([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [selectedClub])

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

  const getSortedNoticias = (noticiasToSort: ClubNews[]) => {
    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(noticia => 
        noticiasToSort.some(filtered => filtered.id === noticia.id)
      )
    }

    const sorted = [...noticiasToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'date':
          aValue = getNewsSortDate(a).getTime()
          bValue = getNewsSortDate(b).getTime()
          break
        case 'author':
          aValue = getAuthorName(a).toLowerCase()
          bValue = getAuthorName(b).toLowerCase()
          break
        case 'category':
          aValue = getNewsCategory(a).toLowerCase()
          bValue = getNewsCategory(b).toLowerCase()
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

  // Filtrar noticias según término de búsqueda
  const filteredNoticias = noticias.filter((noticia) => {
    const searchLower = searchTerm.toLowerCase()
    const author = getAuthorName(noticia)
    const category = getNewsCategory(noticia)
    const status = getNewsStatus(noticia)
    
    return (
      noticia.title.toLowerCase().includes(searchLower) ||
      author.toLowerCase().includes(searchLower) ||
      category.toLowerCase().includes(searchLower) ||
      status.toLowerCase().includes(searchLower) ||
      (noticia.extract && noticia.extract.toLowerCase().includes(searchLower)) ||
      (noticia.tags && noticia.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    )
  })

  // Apply sorting to filtered news
  const sortedAndFilteredNoticias = getSortedNoticias(filteredNoticias)

  // Función para eliminar una noticia usando la API
  const handleDeleteNoticia = async () => {
    if (!noticiaToDelete) return
    
    try {
      setIsDeleting(true)
      setError(null)
      
      await apiCall(`/news/${noticiaToDelete}`, { method: 'DELETE' })
      
      // Actualizar el estado local
      setNoticias(noticias.filter((noticia) => noticia.id !== noticiaToDelete))
      setOriginalOrder(originalOrder.filter((noticia) => noticia.id !== noticiaToDelete))
      setShowDeleteDialog(false)
      setNoticiaToDelete(null)
    } catch (err) {
      console.error('Error al eliminar noticia:', err)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al eliminar la noticia')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show loading while clubs are being loaded or if no club is selected yet
  if (clubsLoading || !selectedClub) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Cargando...</h3>
          <p className="text-muted-foreground">Cargando información del club...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Noticias</h1>
          <p className="text-muted-foreground">Gestiona las noticias publicadas por {selectedClub.name}.</p>
        </div>
        <Button asChild className="w-fit">
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, autor, categoría o contenido..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSearchTerm("")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchTerm("publicada")}>Publicadas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchTerm("borrador")}>Borradores</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleSort('title')}>
                Título {getSortIcon('title')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('date')}>
                Fecha {getSortIcon('date')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('author')}>
                Autor {getSortIcon('author')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('category')}>
                Categoría {getSortIcon('category')}
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

      <>
        {/* Desktop Table View - Hidden on mobile */}
        <div className="rounded-md border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[400px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Título
                    {getSortIcon('title') && <span className="text-xs">{getSortIcon('title')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('author')}
                >
                  <div className="flex items-center gap-1">
                    Autor
                    {getSortIcon('author') && <span className="text-xs">{getSortIcon('author')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    {getSortIcon('date') && <span className="text-xs">{getSortIcon('date')}</span>}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Categoría
                    {getSortIcon('category') && <span className="text-xs">{getSortIcon('category')}</span>}
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Cargando noticias...</p>
                  </TableCell>
                </TableRow>
              ) : sortedAndFilteredNoticias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron noticias que coincidan con la búsqueda.' : 'No hay noticias registradas.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredNoticias.map((noticia) => {
                  const author = getAuthorName(noticia)
                  const formattedDate = formatDate(noticia.date)
                  const category = getNewsCategory(noticia)
                  const status = getNewsStatus(noticia)
                  
                  return (
                    <TableRow key={noticia.id}>
                      <TableCell className="font-medium">{noticia.title}</TableCell>
                      <TableCell>{author}</TableCell>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>{category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(status)}
                          className={getStatusBadgeClass(status)}
                        >
                          {getStatusText(status)}
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
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="md:hidden pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Cargando noticias...</p>
            </div>
          ) : sortedAndFilteredNoticias.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron noticias que coincidan con la búsqueda.' : 'No hay noticias registradas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAndFilteredNoticias.map((noticia) => {
                const author = getAuthorName(noticia)
                const formattedDate = formatDate(noticia.date)
                const category = getNewsCategory(noticia)
                const status = getNewsStatus(noticia)
                
                return (
                  <div key={noticia.id} className="bg-card rounded-lg border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-5 text-card-foreground mb-2 line-clamp-2">
                          {noticia.title}
                        </h3>
                        
                        {noticia.extract && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {noticia.extract}
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-terracotta">
                              {formattedDate}
                            </span>
                            <span>•</span>
                            <span className="truncate">{author}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={getStatusBadgeVariant(status)}
                                className={`text-xs ${getStatusBadgeClass(status)}`}
                              >
                                {getStatusText(status)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>

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
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNoticia}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

