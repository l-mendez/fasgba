import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { EditNewsForm } from "./edit-news-form"

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Editar noticia' }

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
  created_at: string
  updated_at: string
}

// Server function to get user from session
async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Server function to fetch news data
async function getNewsData(newsId: string): Promise<News | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('news')
      .select(`
        *,
        clubs (
          id,
          name
        )
      `)
      .eq('id', newsId)
      .single()

    if (error) {
      console.error('Error fetching news:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      date: data.date,
      image: data.image,
      extract: data.extract || '',
      text: data.text,
      tags: data.tags || [],
      club_id: data.club_id,
      club: data.clubs ? {
        id: data.clubs.id,
        name: data.clubs.name
      } : null,
      created_by_auth_id: data.created_by_auth_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error in getNewsData:', error)
    return null
  }
}

// Server function to check if user can edit the news. Roles are checked
// before authorship so admins return to their panel, not the public list.
async function canUserEditNews(userId: string, news: News, source?: string): Promise<{ canEdit: boolean; redirectPath: string }> {
  try {
    const supabase = await createClient()

    const [{ data: siteAdmin }, { data: clubAdmin }] = await Promise.all([
      supabase.from('admins').select('auth_id').eq('auth_id', userId).maybeSingle(),
      news.club_id
        ? supabase
            .from('club_admins')
            .select('auth_id')
            .eq('auth_id', userId)
            .eq('club_id', news.club_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    // Users can be both: the panel they came from wins.
    if (clubAdmin && (source === 'club-admin' || !siteAdmin)) {
      return { canEdit: true, redirectPath: '/club-admin/noticias' }
    }
    if (siteAdmin) {
      return { canEdit: true, redirectPath: '/admin/noticias' }
    }
    if (news.created_by_auth_id === userId) {
      return { canEdit: true, redirectPath: '/noticias' }
    }

    return { canEdit: false, redirectPath: '/noticias' }
  } catch (error) {
    console.error('Error checking edit permissions:', error)
    return { canEdit: false, redirectPath: '/noticias' }
  }
}

// Server component
export default async function EditNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ source?: string }>
}) {
  const { id: newsId } = await params
  const { source } = await searchParams

  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch news data
  const news = await getNewsData(newsId)
  if (!news) {
    notFound()
  }

  // Check if user can edit this news
  const { canEdit, redirectPath } = await canUserEditNews(user.id, news, source)
  if (!canEdit) {
    notFound()
  }

  return <EditNewsForm news={news} redirectPath={redirectPath} />
} 