import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Calendar, ChevronLeft } from "lucide-react"
import { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import NewsContentWrapper from "@/app/components/news-content-wrapper"
import { getNewsById } from "@/lib/newsUtils"

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
  created_by_auth_id: string | null
  author_name?: string
  author_email?: string
  created_at: string
  updated_at: string
}

// Generate metadata for better link previews
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  // Fetch the news item for metadata
  const newsItem = await getNewsById(parseInt(id), ['club', 'author'])
  
  if (!newsItem) {
    return {
      title: 'Noticia no encontrada - FASGBA',
      description: 'La noticia que estás buscando no existe o ha sido eliminada.',
    }
  }

  // Format the date nicely
  const formattedDate = new Date(newsItem.date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Create a description from extract or truncated text
  const description = newsItem.extract || 
    (newsItem.text ? newsItem.text.substring(0, 160) + '...' : 'Lee la noticia completa en FASGBA')

  // Build the full URL for the article
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.org'}/noticias/${id}`
  
  // Get the image URL (handle both relative and absolute URLs)
  const imageUrl = newsItem.image ? 
    (newsItem.image.startsWith('http') ? newsItem.image : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.org'}${newsItem.image}`) 
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.org'}/images/fasgba-logo.png`

  // Create author information
  const author = newsItem.author_name || (newsItem.club?.name ? `${newsItem.club.name}` : 'FASGBA')

  return {
    title: `${newsItem.title} - FASGBA`,
    description,
    authors: [{ name: author }],
    keywords: newsItem.tags?.length ? newsItem.tags : ['FASGBA', 'noticias', 'fútbol argentino'],
    openGraph: {
      title: newsItem.title,
      description,
      url,
      siteName: 'FASGBA',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: newsItem.title,
        }
      ],
      locale: 'es_AR',
      type: 'article',
      publishedTime: newsItem.created_at,
      modifiedTime: newsItem.updated_at,
      authors: [author],
      tags: newsItem.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: newsItem.title,
      description,
      images: [imageUrl],
      creator: `@FASGBA`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:author': author,
      'article:published_time': newsItem.created_at,
      'article:modified_time': newsItem.updated_at,
      'article:section': newsItem.club?.name || 'Noticias',
      'article:tag': newsItem.tags?.join(', ') || '',
    },
  }
}

// Server component
export default async function NoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before using its properties (Next.js 15 requirement)
  const { id } = await params
  
  // Fetch the specific news item using the utility function
  const newsItem = await getNewsById(parseInt(id), ['club', 'author'])
  
  // Handle not found or error
  if (!newsItem) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader pathname={`/noticias/${id}`} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-xl sm:text-2xl font-bold text-terracotta mb-3 sm:mb-4">Noticia no encontrada</h1>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">La noticia que estás buscando no existe o ha sido eliminada.</p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white text-sm sm:text-base">
              <Link href="/noticias">Volver a noticias</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }
  
  // Fetch related news
  const supabase = await createClient()
  const { data: relatedNews } = await supabase
    .from('news')
    .select(`
      id,
      title,
      date,
      image,
      tags
    `)
    .neq('id', newsItem.id)
    .filter('tags', 'cs', `{${(newsItem.tags || []).join(',')}}`)
    .order('date', { ascending: false })
    .limit(2)

  // Transform the newsItem to match the News interface
  const transformedNewsItem: News = {
    id: newsItem.id,
    title: newsItem.title,
    date: newsItem.date,
    image: newsItem.image,
    extract: newsItem.extract || '',
    text: newsItem.text,
    tags: newsItem.tags ?? [],
    club_id: newsItem.club_id,
    club: newsItem.club ? {
      id: newsItem.club.id,
      name: newsItem.club.name
    } : null,
    created_by_auth_id: newsItem.created_by_auth_id,
    author_name: newsItem.author_name,
    author_email: newsItem.author_email,
    created_at: newsItem.created_at,
    updated_at: newsItem.updated_at
  }

  return <NewsContentWrapper newsItem={transformedNewsItem} relatedNews={relatedNews || []} />
}

