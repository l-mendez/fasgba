import React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { EditNewsForm } from "./edit-news-form"

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

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

// Server function to check if user can edit the news
async function canUserEditNews(userId: string, news: News): Promise<{ canEdit: boolean; redirectPath: string }> {
  try {
    const supabase = await createClient()
    
    // Check if user is the author
    if (news.created_by_auth_id === userId) {
      return { canEdit: true, redirectPath: '/noticias' }
    }
    
    // Check if user is a site-wide admin
    const { data: siteAdmin } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', userId)
      .single()

    if (siteAdmin) {
      return { canEdit: true, redirectPath: '/admin/noticias' }
    }
    
    // Check if user is a club admin and the news belongs to their club
    if (news.club_id) {
      const { data: clubAdmin } = await supabase
        .from('club_admins')
        .select('auth_id')
        .eq('auth_id', userId)
        .eq('club_id', news.club_id)
        .single()

      if (clubAdmin) {
        return { canEdit: true, redirectPath: '/club-admin/noticias' }
      }
    }
    
    return { canEdit: false, redirectPath: '/noticias' }
  } catch (error) {
    console.error('Error checking edit permissions:', error)
    return { canEdit: false, redirectPath: '/noticias' }
  }
}

// Server component
export default async function EditNewsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params
  const { id: newsId } = await params

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
  const { canEdit, redirectPath } = await canUserEditNews(user.id, news)
  if (!canEdit) {
    notFound()
  }

  return <EditNewsForm news={news} redirectPath={redirectPath} />
} 