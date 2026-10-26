import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { NewNewsForm, type NewsClubOption } from "./new-news-form"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Nueva noticia' }

// Server component props to include searchParams
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Server function to get current user
async function getCurrentUser(): Promise<{ id: string } | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return { id: user.id }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Server function to check if user is site admin
async function isSiteAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', userId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Error checking site admin:', error)
    return false
  }
}

// Server function to get user's clubs (for club admins)
async function getUserClubs(userId: string): Promise<NewsClubOption[]> {
  try {
    const supabase = await createClient()
    
    // Get clubs where user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('club_admins')
      .select(`
        club_id,
        clubs (
          id,
          name
        )
      `)
      .eq('auth_id', userId)
      .order('club_id')

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return []
    }

    const clubs = (adminData || [])
      .map((item) => (Array.isArray(item.clubs) ? item.clubs[0] : item.clubs) as NewsClubOption | null)
      .filter((club): club is NewsClubOption => Boolean(club))

    return clubs
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return []
  }
}

// Server component
export default async function NuevaNoticiaPage({ searchParams }: PageProps) {
  // Get search params
  const params = await searchParams
  const source = params.source as string | undefined
  const selectedClubId = params.clubId ? parseInt(params.clubId as string) : undefined

  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Check if user is site admin
  const isAdmin = await isSiteAdmin(user.id)
  
  // Always get user's clubs (both site admins and club admins might have club admin permissions)
  const userClubs = await getUserClubs(user.id)
  
  // If user is not site admin and has no clubs, they can't create news
  if (!isAdmin && userClubs.length === 0) {
    notFound()
  }

  // Coming from club-admin wins over the site-admin role (users can be both):
  // it preselects that club and returns to the club panel.
  const fromClubAdmin = source === 'club-admin' || !isAdmin
  const requestedClub = userClubs.find((club) => club.id === selectedClubId)
  const defaultEntityId = fromClubAdmin
    ? (requestedClub ?? userClubs[0])?.id ?? null
    : isAdmin ? null : userClubs[0]?.id ?? null

  return (
    <NewNewsForm
      userClubs={userClubs}
      isAdmin={isAdmin}
      defaultEntityId={defaultEntityId}
      clubsFirst={fromClubAdmin}
      returnPath={fromClubAdmin ? '/club-admin/noticias' : '/admin/noticias'}
    />
  )
}
