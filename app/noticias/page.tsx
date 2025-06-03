import Link from "next/link"
import { Calendar, Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { NewsFilters } from "@/components/news-filters"
import { NewsPagination } from "@/components/news-pagination"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

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

interface PageProps {
  searchParams: {
    tag?: string
    club?: string
    page?: string
  }
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

// Helper function to get display name for club
function getClubDisplayName(newsItem: News) {
  return newsItem.club?.name || 'FASGBA'
}

async function fetchNews(): Promise<News[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/news?limit=100&include=club`, {
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch news')
    }
    
    const data = await response.json()
    return data.news || []
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

async function fetchTags(): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/news/tags`, {
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }
    
    const data = await response.json()
    return data.tags || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

async function fetchClubs(): Promise<Club[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs`, {
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch clubs')
    }
    
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
}

function applyFilters(news: News[], selectedTag: string, selectedClub: string): News[] {
  let filtered = news

  // Apply tag filter
  if (selectedTag && selectedTag !== 'all') {
    filtered = filtered.filter(item => 
      item.tags && item.tags.includes(selectedTag)
    )
  }

  // Apply club filter
  if (selectedClub && selectedClub !== 'all') {
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

  return filtered
}

function paginateNews(news: News[], page: number, itemsPerPage: number = 9) {
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNews = news.slice(startIndex, endIndex)
  const totalPages = Math.ceil(news.length / itemsPerPage)
  
  return {
    news: paginatedNews,
    totalPages,
    currentPage: page,
    totalItems: news.length
  }
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  const selectedTag = searchParams.tag || 'all'
  const selectedClub = searchParams.club || 'all'
  const currentPage = parseInt(searchParams.page || '1', 10)

  // Fetch all data in parallel
  const [allNews, tags, clubs] = await Promise.all([
    fetchNews(),
    fetchTags(),
    fetchClubs()
  ])

  // Apply filters
  const filteredNews = applyFilters(allNews, selectedTag, selectedClub)
  
  // Apply pagination
  const { news: currentNews, totalPages, totalItems } = paginateNews(filteredNews, currentPage)

  // Check if any filters are active
  const hasActiveFilters = selectedTag !== 'all' || selectedClub !== 'all'

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/noticias" />
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
                
                <NewsFilters 
                  tags={tags}
                  clubs={clubs}
                  selectedTag={selectedTag}
                  selectedClub={selectedClub}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </div>

            {/* Results info */}
            <div className="mb-6 text-sm text-muted-foreground">
              Mostrando {currentNews.length} de {filteredNews.length} noticias
              {hasActiveFilters && ` (${allNews.length} total)`}
            </div>

            {/* Content */}
            {filteredNews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'No se encontraron noticias con los filtros seleccionados.'
                    : 'No hay noticias disponibles en este momento.'
                  }
                </p>
                {hasActiveFilters && (
                  <Link href="/noticias">
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                    >
                      Limpiar filtros
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* News grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentNews.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                      <Link href={`/noticias/${item.id}`}>
                        <div className="cursor-pointer hover:scale-[1.02] transition-transform">
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
                          </CardContent>
                        </div>
                      </Link>
                      
                      {/* Tags outside the main link to avoid nested links */}
                      {item.tags && item.tags.length > 0 && (
                        <CardContent className="pt-0 px-4 pb-4">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Link
                                key={tag}
                                href={`/noticias?tag=${encodeURIComponent(tag)}`}
                              >
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover:bg-amber/20 hover:text-amber-dark transition-colors"
                                >
                                  {tag}
                                </Badge>
                              </Link>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <NewsPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    searchParams={searchParams}
                  />
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

