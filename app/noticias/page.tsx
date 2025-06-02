import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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

export default async function NoticiasPage() {
  // Initialize Supabase client
  const supabase = createServerComponentClient({ 
    cookies
  })
  
  // Fetch news from the database
  const { data: newsData, error } = await supabase
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
      created_at,
      updated_at
    `)
    .order('date', { ascending: false })
  
  // Handle potential errors
  if (error) {
    console.error("Error fetching news:", error)
  }
  
  // Process the news data
  const news = newsData?.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    image: item.image,
    extract: item.extract,
    tags: item.tags || [],
    club: item.club,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || []
  
  // Get unique tags from all news for filtering
  const allTags = Array.from(
    new Set(
      news.flatMap(item => item.tags)
    )
  ).filter(Boolean)

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
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-terracotta">Todas las noticias</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-amber text-amber-dark hover:bg-amber/10 cursor-pointer">
                  Todas
                </Badge>
                {allTags.slice(0, 4).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10 cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500">No se pudieron cargar las noticias. Por favor, inténtalo de nuevo más tarde.</p>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((noticia) => (
                  <Link key={noticia.id} href={`/noticias/${noticia.id}`} className="group">
                    <div className="overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={noticia.image || "/placeholder.svg"}
                          alt={noticia.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {noticia.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="border-amber/20 text-muted-foreground">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-terracotta group-hover:text-amber-dark transition-colors">
                          {noticia.title}
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{noticia.extract}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 text-amber" />
                          <span>{formatDate(noticia.date)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {news.length > 0 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button variant="outline" className="border-amber text-amber-dark hover:bg-amber/10" disabled>
                  Anterior
                </Button>
                <Button variant="outline" className="border-amber bg-amber/10 text-amber-dark hover:bg-amber/20">
                  1
                </Button>
                <Button
                  variant="outline"
                  className="border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  className="border-amber/20 text-muted-foreground hover:border-amber hover:text-amber-dark hover:bg-amber/10"
                >
                  3
                </Button>
                <Button variant="outline" className="border-amber text-amber-dark hover:bg-amber/10">
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

