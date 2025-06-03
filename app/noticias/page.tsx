'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"

// Define the news interface
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
  created_at: string
  updated_at: string
}

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

// Format date to a more readable format
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return date.toLocaleDateString('es-AR', options)
}

export default function NoticiasPage() {
  const [news, setNews] = useState<News[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedClub, setSelectedClub] = useState<string>('all')
  const [filteredNews, setFilteredNews] = useState<News[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 9

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Apply filters when news or filter states change
  useEffect(() => {
    applyFilters()
  }, [news, selectedTag, selectedClub])

  // Handle pagination when filtered news changes
  useEffect(() => {
    const total = Math.ceil(filteredNews.length / itemsPerPage)
    setTotalPages(total)
    if (currentPage > total && total > 0) {
      setCurrentPage(1)
    }
  }, [filteredNews.length, currentPage])

  async function fetchInitialData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch news, tags, and clubs in parallel
      const [newsResponse, tagsResponse, clubsResponse] = await Promise.all([
        fetch('/api/news?limit=100&include=club'),
        fetch('/api/news/tags'),
        fetch('/api/clubs')
      ])

      if (!newsResponse.ok || !tagsResponse.ok || !clubsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [newsData, tagsData, clubsData] = await Promise.all([
        newsResponse.json(),
        tagsResponse.json(),
        clubsResponse.json()
      ])

      setNews(newsData.news || [])
      setTags(tagsData.tags || [])
      setClubs(clubsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('No se pudieron cargar las noticias. Por favor, inténtalo de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = news

    // Apply tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(selectedTag)
      )
    }

    // Apply club filter
    if (selectedClub !== 'all') {
      if (selectedClub === 'fasgba') {
        // Filter for news without club (null club_id)
        filtered = filtered.filter(item => !item.club_id)
      } else {
        // Filter for specific club
        filtered = filtered.filter(item => 
          item.club_id && item.club_id.toString() === selectedClub
        )
      }
    }

    setFilteredNews(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  function clearFilters() {
    setSelectedTag('all')
    setSelectedClub('all')
  }

  function handleTagFilter(tag: string) {
    setSelectedTag(tag)
  }

  function handleClubFilter(clubId: string) {
    setSelectedClub(clubId)
  }

  // Helper function to get display name for club
  function getClubDisplayName(newsItem: News) {
    return newsItem.club?.name || 'FASGBA'
  }

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNews = filteredNews.slice(startIndex, endIndex)

  // Check if any filters are active
  const hasActiveFilters = selectedTag !== 'all' || selectedClub !== 'all'

  // Mobile filter component
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Clear filters */}
      {hasActiveFilters && (
        <Button 
          onClick={clearFilters} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          Limpiar filtros
        </Button>
      )}

      {/* Tag filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === 'all' ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedTag === 'all' 
                ? 'bg-amber hover:bg-amber/90 text-amber-dark' 
                : 'hover:bg-gray-200'
            }`}
            onClick={() => handleTagFilter('all')}
          >
            Todas
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'secondary'}
              className={`cursor-pointer transition-colors ${
                selectedTag === tag 
                  ? 'bg-amber hover:bg-amber/90 text-amber-dark' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Club filter */}
      <div>
        <h3 className="font-medium text-sm mb-3 text-foreground">Clubes</h3>
        <Select value={selectedClub} onValueChange={handleClubFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clubes</SelectItem>
            <SelectItem value="fasgba">FASGBA</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id.toString()}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-black">Noticias</h1>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Mantenete al día con las últimas novedades del ajedrez en la región sur de Buenos Aires
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber"></div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-black">Noticias</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Mantenete al día con las últimas novedades del ajedrez en la región sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {/* Desktop filters and title */}
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta mb-4">
                  {hasActiveFilters ? 'Noticias filtradas' : 'Todas las noticias'}
                </h2>
                
                {/* Desktop filters */}
                <div className="hidden lg:block space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorías</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedTag === 'all' ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          selectedTag === 'all'
                            ? 'bg-amber text-amber-dark hover:bg-amber/90'
                            : 'border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10'
                        }`}
                        onClick={() => handleTagFilter('all')}
                      >
                        Todas
                      </Badge>
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTag === tag ? 'default' : 'outline'}
                          className={`cursor-pointer ${
                            selectedTag === tag
                              ? 'bg-amber text-amber-dark hover:bg-amber/90'
                              : 'border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10'
                          }`}
                          onClick={() => handleTagFilter(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Club</h3>
                    <div className="flex items-center gap-4">
                      <Select value={selectedClub} onValueChange={handleClubFilter}>
                        <SelectTrigger className="w-[250px] border-amber/20 focus:ring-amber focus:border-amber">
                          <SelectValue placeholder="Seleccionar club" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los clubes</SelectItem>
                          <SelectItem value="fasgba">FASGBA</SelectItem>
                          {clubs.map((club) => (
                            <SelectItem key={club.id} value={club.id.toString()}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile filter trigger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 bg-amber/20 text-amber-dark">
                          {(selectedTag !== 'all' ? 1 : 0) + (selectedClub !== 'all' ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filtros de noticias</SheetTitle>
                      <SheetDescription>
                        Filtra las noticias por categoría o club
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Results info */}
            <div className="mb-6 text-sm text-muted-foreground">
              Mostrando {currentNews.length} de {filteredNews.length} noticias
              {hasActiveFilters && ` (${news.length} total)`}
            </div>

            {/* Error state */}
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button
                  onClick={fetchInitialData}
                  className="mt-4 bg-amber hover:bg-amber/90 text-amber-dark"
                >
                  Intentar de nuevo
                </Button>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'No se encontraron noticias con los filtros seleccionados.'
                    : 'No hay noticias disponibles en este momento.'
                  }
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-amber text-amber-dark hover:bg-amber/10"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* News grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentNews.map((item) => (
                    <Link key={item.id} href={`/noticias/${item.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]">
                        <div className="aspect-video relative bg-muted">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <div className="text-center">
                                <p className="text-sm">Sin imagen</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{formatDate(item.date)}</span>
                            <span className="font-medium">{getClubDisplayName(item)}</span>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          
                          {item.extract && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                              {item.extract}
                            </p>
                          )}
                          
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover:bg-amber/20 hover:text-amber-dark transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTagFilter(tag)
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Anterior
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant="outline"
                          className={
                            currentPage === pageNum
                              ? "border-amber bg-amber/10 text-amber-dark hover:bg-amber/20"
                              : "border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10"
                          }
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

