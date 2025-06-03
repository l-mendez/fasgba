import React from "react"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

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

interface Club {
  id: number
  name: string
}

// Server function to get user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const adminClient = createAdminClient()
    
    const authCookie = cookieStore.get('sb-access-token')
    if (!authCookie) {
      return null
    }

    const { data: { user }, error } = await adminClient.auth.getUser(authCookie.value)
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
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
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

// Server function to check if user is admin of the club
async function checkUserIsAdmin(userId: string, clubId: number): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('club_admins')
      .select('user_id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Server component
export default async function EditClubNewsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // Await the params
  const { id: newsId } = await params

  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    notFound()
  }

  // Fetch news data
  const news = await getNewsData(newsId)
  if (!news) {
    notFound()
  }

  // Check if the news has a club_id
  if (!news.club_id) {
    notFound()
  }

  // Check if user is admin of the club
  const isAdmin = await checkUserIsAdmin(user.id, news.club_id)
  if (!isAdmin) {
    notFound()
  }

  return <EditNewsForm news={news} />
}
