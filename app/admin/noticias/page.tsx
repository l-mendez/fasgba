"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface News {
  id: number
  title: string
  date: string
  image: string | null
  extract: string
  text: string
  tags: string[]
  club_id: number | null
  club: {
    id: number
    name: string
  } | null
  created_by_auth_id: string | null
  author_email?: string
  author_name?: string
  created_at: string
  updated_at: string
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`
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

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<News[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original')
  const [originalOrder, setOriginalOrder] = useState<News[]>([])

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await apiCall('/news?include=author,club')
      
      // The API returns an object with news array and pagination
      if (data.news && Array.isArray(data.news)) {
        // Map the API response to match our News interface
        const mappedNews: News[] = data.news.map((item: any) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          image: item.image,
          extract: item.extract,
          text: item.text,
          tags: item.tags || [],
          club_id: item.club_id,
          club: item.club,
          created_by_auth_id: item.created_by_auth_id,
          author_email: item.author_email,
          author_name: item.author_name,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }))
        
        setNews(mappedNews)
        setOriginalOrder(mappedNews)
      } else {
        setNews([])
        setOriginalOrder([])
      }
    } catch (err) {
      console.error('Error fetching news:', err)
      setError(err instanceof Error ? err.message : "Error al cargar las noticias")
      setNews([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  // Delete news function
  const deleteNews = async (newsId: number) => {
    return await apiCall(`/news/${newsId}`, {
      method: 'DELETE'
    })
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

  const getSortedNews = (newsToSort: News[]) => {
    if (!sortBy || sortOrder === 'original') {
      return originalOrder.filter(newsItem => 
        newsToSort.some(filtered => filtered.id === newsItem.id)
      )
    }

    const sorted = [...newsToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'club':
          aValue = (a.club?.name || 'FASGBA').toLowerCase()
          bValue = (b.club?.name || 'FASGBA').toLowerCase()
          break
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'author':
          aValue = (a.author_name || a.author_email || 'Desconocido').toLowerCase()
          bValue = (b.author_name || b.author_email || 'Desconocido').toLowerCase()
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

  const handleDeleteNews = async () => {
    if (!newsToDelete) return
    
    try {
      await deleteNews(newsToDelete)
      
      // Update local state
      setNews(prevNews => prevNews.filter(item => item.id !== newsToDelete))
      setShowDeleteDialog(false)
      setNewsToDelete(null)
    } catch (err) {
      console.error('Error deleting news:', err)
      // Handle error appropriately
    }
  }

  const filteredNews = news.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.extract.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Apply sorting to filtered news
  const sortedAndFilteredNews = getSortedNews(filteredNews)

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-terracotta">Noticias</h1>
        <Button asChild className="bg-terracotta hover:bg-terracotta/90">
          <Link href="/admin/noticias/nueva">
            <Plus className="h-4 w-4 mr-2" />
            Nueva noticia
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <DropdownMenuItem onClick={() => setSearchTerm("")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchTerm("FASGBA")}>FASGBA</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const today = new Date()
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                const lastWeekStr = lastWeek.toISOString().split('T')[0]
                setSearchTerm(lastWeekStr)
              }}>Última semana</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                const lastMonthStr = lastMonth.toISOString().split('T')[0]
                setSearchTerm(lastMonthStr)
              }}>Último mes</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => handleSort('club')}>
                Club {getSortIcon('club')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('date')}>
                Fecha {getSortIcon('date')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('author')}>
                Creado por {getSortIcon('author')}
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="rounded-md border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Título
                      {getSortIcon('title') && <span className="text-xs">{getSortIcon('title')}</span>}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('club')}
                  >
                    <div className="flex items-center gap-1">
                      Club
                      {getSortIcon('club') && <span className="text-xs">{getSortIcon('club')}</span>}
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
                    onClick={() => handleSort('author')}
                  >
                    <div className="flex items-center gap-1">
                      Creado por
                      {getSortIcon('author') && <span className="text-xs">{getSortIcon('author')}</span>}
                    </div>
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredNews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No se encontraron noticias
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredNews.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.club?.name || "FASGBA"}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {item.author_name ? (
                                item.author_name.charAt(0).toUpperCase()
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-gray-600"
                                >
                                  <path
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {item.author_name || item.author_email || "Desconocido"}
                            </span>
                            {item.author_name && item.author_email && (
                              <span className="text-xs text-muted-foreground">
                                {item.author_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
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
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/noticias/${item.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/noticias/${item.id}/editar`} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setNewsToDelete(item.id)
                                setShowDeleteDialog(true)
                              }}
                            >
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

          {/* Mobile Card View - Hidden on desktop */}
          <div className="md:hidden space-y-4">
            {sortedAndFilteredNews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron noticias
              </div>
            ) : (
              sortedAndFilteredNews.map((item) => (
                <div key={item.id} className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-5 text-card-foreground mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-terracotta">
                            {item.club?.name || "FASGBA"}
                          </span>
                          <span>•</span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {item.author_name ? (
                                item.author_name.charAt(0).toUpperCase()
                              ) : (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-gray-600"
                                >
                                  <path
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                    fill="currentColor"
                                  />
                                </svg>
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.author_name || item.author_email || "Desconocido"}
                          </span>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/noticias/${item.id}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/noticias/${item.id}/editar`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => {
                            setNewsToDelete(item.id)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la noticia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteNews}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

