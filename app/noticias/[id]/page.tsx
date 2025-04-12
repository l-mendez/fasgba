import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Calendar, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import NewsContentWrapper from "@/app/components/news-content-wrapper"

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

// Server component
export default async function NoticiaPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ 
    cookies
  })
  
  // Fetch the specific news item
  const { data: newsItem, error } = await supabase
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
    .eq('id', params.id)
    .single()
  
  // Handle not found or error
  if (error || !newsItem) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta mb-4">Noticia no encontrada</h1>
            <p className="text-muted-foreground mb-6">La noticia que estás buscando no existe o ha sido eliminada.</p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
              <Link href="/noticias">Volver a noticias</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }
  
  // Fetch related news
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
    .filter('tags', 'cs', `{${newsItem.tags.join(',')}}`)
    .order('date', { ascending: false })
    .limit(2)

  return <NewsContentWrapper newsItem={newsItem} relatedNews={relatedNews || []} />
}

