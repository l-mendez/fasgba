"use client"

import Link from "next/link"
import { Calendar, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// Simpler loading placeholder
const ChessComponentLoader = () => (
  <div className="w-full h-[300px] bg-muted/50 animate-pulse flex items-center justify-center rounded-md my-6">
    <span className="text-muted-foreground">Cargando tablero de ajedrez...</span>
  </div>
);

// Client-side only chess components - simplify the dynamic import
const ChessGameBlock = dynamic(
  () => import('@/app/components/chess-game-block'),
  { 
    ssr: false,
    loading: () => <ChessComponentLoader />
  }
);

// Format date function for client-side
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return date.toLocaleDateString('es-AR', options)
}

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

// Component to render content blocks
const ContentRenderer = ({ content }: { content: any[] }) => {
  return (
    <div className="prose prose-amber max-w-none">
      {content.map((block, index) => {
        if (block.type === 'text') {
          return <div key={index} dangerouslySetInnerHTML={{ __html: block.content }} />
        }
        
        if (block.type === 'image') {
          return (
            <figure key={index} className="my-6">
              <img 
                src={block.url} 
                alt={block.caption || 'Imagen'} 
                className="rounded-md mx-auto"
              />
              {block.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{block.caption}</figcaption>}
            </figure>
          )
        }
        
        if (block.type === 'chess' || block.type === 'chess_game') {
          return (
            <ChessGameBlock 
              key={index} 
              fen={block.fen || block.content?.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"} 
              pgn={block.pgn || block.content?.pgn} 
              whitePlayer={block.whitePlayer || block.content?.whitePlayer}
              blackPlayer={block.blackPlayer || block.content?.blackPlayer}
            />
          )
        }
        
        return null
      })}
    </div>
  )
}

// Wrapper component for client-side rendering
export default function NewsContentWrapper({ 
  newsItem, 
  relatedNews
}: { 
  newsItem: News, 
  relatedNews: any[]
}) {
  // Process the news content
  let contentBlocks;
  try {
    contentBlocks = JSON.parse(newsItem.text);
    if (!Array.isArray(contentBlocks)) {
      // If it's not an array, create a single text block
      contentBlocks = [{ type: 'text', content: newsItem.text }];
    }
  } catch (e) {
    // If parsing fails, treat it as HTML content
    contentBlocks = [{ type: 'text', content: newsItem.text }];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article>
          {/* Imagen de cabecera */}
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full">
            <img
              src={newsItem.image || "/placeholder.svg"}
              alt={newsItem.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          </div>

          {/* Contenido principal */}
          <div className="container px-4 md:px-6 -mt-20 relative z-10">
            <div className="mx-auto max-w-3xl bg-background rounded-lg border border-amber/20 shadow-lg p-6 md:p-10">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mb-6 border-amber text-amber-dark hover:bg-amber/10"
              >
                <Link href="/noticias">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Volver a noticias
                </Link>
              </Button>

              <div className="mb-4 flex flex-wrap gap-2">
                {newsItem.tags && newsItem.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-amber/20 text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="mb-4 text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{newsItem.title}</h1>

              <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-amber" />
                <span>{formatDate(newsItem.date)}</span>
              </div>

              <ContentRenderer content={contentBlocks} />
            </div>
          </div>

          {/* Noticias relacionadas */}
          {relatedNews && relatedNews.length > 0 && (
            <div className="container px-4 md:px-6 py-12 md:py-16">
              <div className="mx-auto max-w-3xl">
                <h2 className="mb-6 text-2xl font-bold text-terracotta">Noticias relacionadas</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {relatedNews.map((news) => (
                    <Link key={news.id} href={`/noticias/${news.id}`} className="group">
                      <div className="overflow-hidden rounded-lg border border-amber/20 bg-background shadow-md transition-colors hover:border-amber">
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={news.image || "/placeholder.svg"}
                            alt={news.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="mb-2 text-lg font-bold text-terracotta group-hover:text-amber-dark transition-colors">
                            {news.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 text-amber" />
                            <span>{formatDate(news.date)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  )
} 