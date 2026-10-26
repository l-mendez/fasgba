"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpDown, Eye, Pencil, Search, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog"
import { AdminRowActions, type AdminRowAction } from "@/components/admin-row-actions"
import { AdminSortIcon } from "@/components/admin-sort-icon"
import { ErrorAlert } from "@/components/error-alert"
import { clubAdminEditorHref } from "@/lib/club-admin/links"
import { deleteNewsAction } from "@/lib/actions/news"
import { formatArgentinaDateOnly, getDateInputValue } from "@/lib/dateUtils"
import { compareBy } from "@/lib/sortUtils"
import { apiCall } from "@/lib/utils/apiClient"
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

interface NoticiasContentProps {
  initialNews: ClubNews[]
  initialClubId: number
}

// Helper functions for data processing
const formatDate = (dateString: string) => {
  try {
    return formatArgentinaDateOnly(dateString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

type SortField = "title" | "author" | "date" | "category"

const SORT_LABELS: Record<SortField, string> = {
  title: "Título",
  author: "Autor",
  date: "Fecha",
  category: "Categoría",
}

const getSortValue = (news: ClubNews, field: SortField): string => {
  switch (field) {
    case "title":
      return news.title.toLowerCase()
    case "date":
      return getDateInputValue(news.date)
    case "author":
      return getAuthorName(news).toLowerCase()
    case "category":
      return getNewsCategory(news).toLowerCase()
  }
}

export function NoticiasContent({ initialNews, initialClubId }: NoticiasContentProps) {
  const { selectedClub } = useClubContext()
  const [noticias, setNoticias] = useState<ClubNews[]>(initialNews)
  const [newsByClub, setNewsByClub] = useState<Record<number, ClubNews[]>>({
    [initialClubId]: initialNews,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [noticiaToDelete, setNoticiaToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const loadNews = async () => {
    if (!selectedClub) return

    if (newsByClub[selectedClub.id]) {
      setNoticias(newsByClub[selectedClub.id])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const newsData = await apiCall(`/api/clubs/${selectedClub.id}/news`)
      const list: ClubNews[] = Array.isArray(newsData) ? newsData : []
      setNoticias(list)
      setNewsByClub((current) => ({ ...current, [selectedClub.id]: list }))
    } catch (err) {
      console.error("Error loading news:", err)
      setError(err instanceof Error ? err.message : "Error al cargar las noticias")
      setNoticias([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClub) {
      loadNews()
    }
  }, [selectedClub?.id])

  // Cycle: asc -> desc -> original order
  const handleSort = (field: SortField) => {
    if (sortBy !== field) {
      setSortBy(field)
      setSortOrder("asc")
    } else if (sortOrder === "asc") {
      setSortOrder("desc")
    } else {
      setSortBy(null)
    }
  }

  const sortIcon = (field: SortField) => <AdminSortIcon direction={sortBy === field ? sortOrder : null} />

  const searchLower = searchTerm.toLowerCase()
  const filteredNoticias = noticias.filter((noticia) => (
    noticia.title.toLowerCase().includes(searchLower) ||
    getAuthorName(noticia).toLowerCase().includes(searchLower) ||
    getNewsCategory(noticia).toLowerCase().includes(searchLower) ||
    (noticia.extract && noticia.extract.toLowerCase().includes(searchLower)) ||
    (noticia.tags && noticia.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
  ))
  const visibleNoticias = sortBy
    ? [...filteredNoticias].sort(compareBy((news) => getSortValue(news, sortBy), sortOrder))
    : filteredNoticias

  const handleDeleteNoticia = async () => {
    if (!noticiaToDelete) return
    const clubId = selectedClub?.id

    try {
      setIsDeleting(true)
      setError(null)
      const deleteResult = await deleteNewsAction(noticiaToDelete)
      if (!deleteResult.ok) {
        throw new Error(deleteResult.error)
      }

      const remaining = noticias.filter((noticia) => noticia.id !== noticiaToDelete)
      setNoticias(remaining)
      // Keep the per-club cache in sync so switching clubs doesn't resurrect it.
      if (clubId) setNewsByClub((current) => ({ ...current, [clubId]: remaining }))
    } catch (err) {
      console.error("Error al eliminar noticia:", err)
      setError(err instanceof Error ? err.message : "Ocurrió un error al eliminar la noticia")
    } finally {
      setIsDeleting(false)
      setNoticiaToDelete(null)
    }
  }

  const editHref = (noticia: ClubNews) => clubAdminEditorHref(`/noticias/${noticia.id}/editar`)

  const rowActions = (noticia: ClubNews): AdminRowAction[] => [
    { label: "Ver en sitio", icon: Eye, href: `/noticias/${noticia.id}`, external: true },
    { label: "Editar", icon: Pencil, href: editHref(noticia) },
    { label: "Eliminar", icon: Trash2, destructive: true, onSelect: () => setNoticiaToDelete(noticia.id) },
  ]

  const emptyMessage = searchTerm ? "Sin resultados." : "No hay noticias."

  return (
    <>
      {error && <ErrorAlert message={error} />}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, autor, categoría o contenido..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Desktop sorts from the column headers */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden" aria-label="Ordenar" title="Ordenar">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
              <DropdownMenuItem key={field} onSelect={() => handleSort(field)} className="justify-between gap-4">
                {SORT_LABELS[field]}
                {sortIcon(field)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <TableHead
                  key={field}
                  className={`cursor-pointer select-none hover:bg-muted/50 ${field === "author" || field === "category" ? "hidden lg:table-cell" : ""}`}
                  onClick={() => handleSort(field)}
                  aria-sort={sortBy === field ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                >
                  <div className="flex items-center gap-1">
                    {SORT_LABELS[field]}
                    {sortIcon(field)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[60px]"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : visibleNoticias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleNoticias.map((noticia) => (
                <TableRow key={noticia.id}>
                  <TableCell className="font-medium">
                    <Link href={editHref(noticia)} className="hover:underline">{noticia.title}</Link>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{getAuthorName(noticia)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(noticia.date)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{getNewsCategory(noticia)}</TableCell>
                  <TableCell className="text-right">
                    <AdminRowActions actions={rowActions(noticia)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visibleNoticias.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {visibleNoticias.map((noticia) => (
              <div key={noticia.id} className="relative rounded-lg border bg-card p-4 hover:border-amber">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Link
                      href={editHref(noticia)}
                      className="line-clamp-2 text-sm font-medium leading-5 after:absolute after:inset-0"
                    >
                      {noticia.title}
                    </Link>
                    {noticia.extract && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{noticia.extract}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-terracotta">{formatDate(noticia.date)}</span>
                      <span>•</span>
                      <span className="truncate">{getAuthorName(noticia)}</span>
                      <span>•</span>
                      <span>{getNewsCategory(noticia)}</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <AdminRowActions actions={rowActions(noticia)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={noticiaToDelete !== null}
        onOpenChange={(open) => !open && setNoticiaToDelete(null)}
        title="¿Eliminar noticia?"
        onConfirm={handleDeleteNoticia}
        pending={isDeleting}
      />
    </>
  )
}
