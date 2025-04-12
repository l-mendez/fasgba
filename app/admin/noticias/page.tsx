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

// Mock data for news
const mockNews: News[] = [
  {
    id: 1,
    title: "Campeonato Nacional de Ajedrez 2023",
    date: "2023-12-15",
    image: "https://images.unsplash.com/photo-1580549181132-72d10d1dd0a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    extract: "El Campeonato Nacional de Ajedrez 2023 se celebrará en Buenos Aires del 15 al 22 de diciembre.",
    text: "El Campeonato Nacional de Ajedrez 2023 se celebrará en Buenos Aires del 15 al 22 de diciembre. Este evento contará con la participación de los mejores ajedrecistas del país y ofrecerá premios en efectivo por un total de $500,000. Las inscripciones ya están abiertas y se pueden realizar a través de la página web de la Federación Argentina de Ajedrez.",
    tags: ["torneo", "nacional", "2023"],
    club_id: 1,
    club: {
      id: 1,
      name: "Club de Ajedrez Buenos Aires"
    },
    created_by_user_id: 1,
    created_by_user: {
      id: 1,
      name: "Juan",
      surname: "Pérez",
      email: "juan.perez@example.com",
      profile_picture: "https://i.pravatar.cc/150?img=1"
    },
    created_at: "2023-11-01T10:00:00Z",
    updated_at: "2023-11-01T10:00:00Z"
  },
  {
    id: 2,
    title: "Nueva sede para el Club de Ajedrez La Plata",
    date: "2023-11-20",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    extract: "El Club de Ajedrez La Plata inaugurará su nueva sede el próximo 20 de noviembre.",
    text: "El Club de Ajedrez La Plata inaugurará su nueva sede el próximo 20 de noviembre. La nueva ubicación cuenta con un espacio de 500 metros cuadrados, salas de entrenamiento, biblioteca y un café. Este proyecto fue posible gracias al apoyo de los socios y patrocinadores del club.",
    tags: ["club", "inauguración", "la plata"],
    club_id: 2,
    club: {
      id: 2,
      name: "Club de Ajedrez La Plata"
    },
    created_by_user_id: 2,
    created_by_user: {
      id: 2,
      name: "María",
      surname: "González",
      email: "maria.gonzalez@example.com",
      profile_picture: "https://i.pravatar.cc/150?img=5"
    },
    created_at: "2023-10-15T14:30:00Z",
    updated_at: "2023-10-15T14:30:00Z"
  },
  {
    id: 3,
    title: "Entrevista con el Gran Maestro Carlos Rodríguez",
    date: "2023-11-10",
    image: "https://images.unsplash.com/photo-1579547945413-497e1b99dac0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    extract: "Entrevista exclusiva con el Gran Maestro Carlos Rodríguez sobre su carrera y sus planes para el futuro.",
    text: "En esta entrevista exclusiva, el Gran Maestro Carlos Rodríguez nos habla sobre su carrera en el ajedrez, sus mayores logros y sus planes para el futuro. Rodríguez, quien se convirtió en Gran Maestro a los 22 años, ha representado a Argentina en numerosas olimpiadas y ha ganado múltiples torneos internacionales. Actualmente está preparándose para el próximo Campeonato Nacional y tiene planes de abrir una academia de ajedrez en Buenos Aires.",
    tags: ["entrevista", "gran maestro", "carlos rodríguez"],
    club_id: 3,
    club: {
      id: 3,
      name: "Club de Ajedrez Rosario"
    },
    created_by_user_id: 1,
    created_by_user: {
      id: 1,
      name: "Juan",
      surname: "Pérez",
      email: "juan.perez@example.com",
      profile_picture: "https://i.pravatar.cc/150?img=1"
    },
    created_at: "2023-10-05T09:15:00Z",
    updated_at: "2023-10-05T09:15:00Z"
  }
]

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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Use mock data instead of fetching from Supabase
      setNews(mockNews)
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

