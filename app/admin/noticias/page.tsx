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
import { supabase, supabaseAdmin } from "@/lib/supabaseClient"

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

type DatabaseNews = {
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

type SupabaseNews = {
  id: any
  title: any
  date: any
  image: any
  extract: any
  text: any
  tags: any
  club_id: any
  club: {
    id: any
    name: any
  } | null
  created_by_user_id: any
  created_by_user: {
    id: any
    name: any
    surname: any
    email: any
    profile_picture: any
  } | null
  created_at: any
  updated_at: any
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
      
      const { data, error } = await supabase
        .from('news')
        .select(`
          id,
          title,
          date,
          image,
          extract,
          text,
          tags,
          club_id,
          club:clubs(id, name),
          created_by_user_id,
          created_by_user:users(id, name, surname, email, profile_picture),
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const typedData = ((data || []) as unknown as SupabaseNews[]).map(item => ({
        id: Number(item.id),
        title: String(item.title),
        date: String(item.date),
        image: item.image as string | null,
        extract: String(item.extract),
        text: String(item.text),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        club_id: item.club_id ? Number(item.club_id) : null,
        club: item.club ? {
          id: Number(item.club.id),
          name: String(item.club.name)
        } : null,
        created_by_user_id: item.created_by_user_id ? Number(item.created_by_user_id) : null,
        created_by_user: item.created_by_user ? {
          id: Number(item.created_by_user.id),
          name: String(item.created_by_user.name),
          surname: String(item.created_by_user.surname),
          email: String(item.created_by_user.email),
          profile_picture: item.created_by_user.profile_picture as string | null
        } : null,
        created_at: String(item.created_at),
        updated_at: String(item.updated_at)
      })) as News[]

      setNews(typedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las noticias")
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
      
      // First, check if the news exists
      const { data: existingNews, error: fetchError } = await supabase
        .from('news')
        .select('id')
        .eq('id', newsToDelete)
        .single()
        
      if (fetchError) {
        console.error('Error checking if news exists:', fetchError)
        throw fetchError
      }
      
      if (!existingNews) {
        console.error(`News with ID ${newsToDelete} not found`)
        throw new Error(`La noticia con ID ${newsToDelete} no existe`)
      }
      
      // Use supabaseAdmin to bypass Row Level Security
      const { error: deleteError } = await supabaseAdmin
        .from('news')
        .delete()
        .eq('id', newsToDelete)

      if (deleteError) {
        console.error('Error deleting news:', deleteError)
        throw deleteError
      }
      
      console.log(`Successfully deleted news with ID: ${newsToDelete}`)
      
      // Refresh news data after successful deletion
      await fetchNews()
      
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

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredNews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron noticias
                </TableCell>
              </TableRow>
            ) : (
              filteredNews.map((news) => (
                <TableRow key={news.id}>
                  <TableCell className="font-medium">{news.title}</TableCell>
                  <TableCell>{news.club?.name || "Sin club"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={news.created_by_user?.profile_picture || undefined} />
                        <AvatarFallback>
                          {news.created_by_user?.name?.[0]}{news.created_by_user?.surname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {news.created_by_user?.name} {news.created_by_user?.surname}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(news.date).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Publicada
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/noticias/${news.id}/editar`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/noticias/${news.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => {
                            setNewsToDelete(news.id)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar noticia</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setNewsToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

