import Link from "next/link"
import { Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { NewsTable } from "@/components/news-table"

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
  author_email?: string
  author_name?: string
  created_at: string
  updated_at: string
}

// Server-side function to fetch news data
async function fetchNews(): Promise<News[]> {
  try {
    const supabase = await createClient()
    
    // Check if the current user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('No tienes acceso a esta información')
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !adminData) {
      throw new Error('No tienes permisos de administrador para ver esta información')
    }

    // Use the service role client to fetch author information
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      throw new Error('Service role key not configured')
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(supabaseServiceUrl, supabaseServiceKey)

    // Fetch all news with club information
    const { data: newsData, error: newsError } = await supabase
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
        clubs(id, name),
        created_by_auth_id,
        created_at,
        updated_at
      `)
      .order('date', { ascending: false })

    if (newsError) {
      console.error('Error fetching news:', newsError)
      throw new Error('Error al obtener las noticias')
    }

    if (!newsData) {
      return []
    }

    // Get unique author IDs to fetch their information
    const authorIds = [...new Set(newsData
      .map(news => news.created_by_auth_id)
      .filter((id): id is string => id !== null)
    )]

    // Fetch author information from Supabase Auth
    const authorMap = new Map<string, { email: string; name?: string }>()
    
    for (const authId of authorIds) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(authId)
        
        if (!userError && userData.user) {
          authorMap.set(authId, {
            email: userData.user.email || 'email@no-disponible.com',
            name: userData.user.user_metadata?.nombre || userData.user.user_metadata?.name
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch user data for ${authId}:`, error)
      }
    }

    // Transform the news data to match our News interface
    const transformedNews: News[] = newsData.map((item: any) => {
      const author = item.created_by_auth_id ? authorMap.get(item.created_by_auth_id) : null
      
      return {
        id: item.id,
        title: item.title,
        date: item.date,
        image: item.image,
        extract: item.extract,
        text: item.text,
        tags: item.tags || [],
        club_id: item.club_id,
        club: item.clubs ? { id: item.clubs.id, name: item.clubs.name } : null,
        created_by_auth_id: item.created_by_auth_id,
        author_email: author?.email,
        author_name: author?.name,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
    })

    return transformedNews
  } catch (error) {
    console.error('Error fetching news:', error)
    throw error
  }
}

export default async function AdminNoticiasPage() {
  let news: News[] = []
  let error: string | null = null

  try {
    news = await fetchNews()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar las noticias"
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p>{error}</p>
        </div>
      </div>
    )
  }

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

      <NewsTable initialNews={news} />
    </div>
  )
}

