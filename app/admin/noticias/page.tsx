"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

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
  created_by_user_id: number | null
  created_by_user: {
    id: number
    name: string
    surname: string
    email: string
    profile_picture: string | null
  } | null
  created_at: string
  updated_at: string
}


export default function AdminNoticiasPage() {
  const [news, setNews] = useState<News[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/news?include=author,club', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
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
          created_by_user_id: item.created_by_auth_id,
          created_by_user: item.created_by_user,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }))
        
        setNews(mappedNews)
      } else {
        setNews([])
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

  const handleDelete = async () => {
    if (!newsToDelete) return

    try {
      console.log(`Attempting to delete news with ID: ${newsToDelete}`)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update the local state by filtering out the deleted news
      setNews(prevNews => prevNews.filter(item => item.id !== newsToDelete))
      
      console.log(`Successfully deleted news with ID: ${newsToDelete}`)
      
      setShowDeleteDialog(false)
      setNewsToDelete(null)
    } catch (err) {
      console.error('Error in handleDelete:', err)
      setError(err instanceof Error ? err.message : "Error al eliminar la noticia")
    }
  }

  const filteredNews = news.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.extract.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.created_by_user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.created_by_user?.surname.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No se encontraron noticias
                  </TableCell>
                </TableRow>
              ) : (
                filteredNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.club?.name || "Sin club"}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.created_by_user?.profile_picture || ""} />
                          <AvatarFallback>
                            {item.created_by_user
                              ? `${item.created_by_user.name.charAt(0)}${item.created_by_user.surname.charAt(0)}`
                              : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {item.created_by_user
                            ? `${item.created_by_user.name} ${item.created_by_user.surname}`
                            : "Desconocido"}
                        </span>
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
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

