import React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { NewNewsForm } from "./new-news-form"

// Force dynamic rendering since we use authentication
export const dynamic = 'force-dynamic'

interface Club {
  id: number
  name: string
  description?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  role?: string
}

// Server component props to include searchParams
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Server function to get current user
async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role
    }
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
async function getUserClubs(userId: string): Promise<Club[]> {
  try {
    const supabase = await createClient()
    
    // Get clubs where user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('club_admins')
      .select(`
        club_id,
        clubs (
          id,
          name,
          address,
          telephone,
          mail,
          schedule
        )
      `)
      .eq('auth_id', userId)

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return []
    }

    // Properly type and filter the clubs data
    const clubs: Club[] = (adminData || [])
      .filter(item => item.clubs)
      .map(item => {
        const club = item.clubs as any
        return {
          id: club.id,
          name: club.name,
          description: undefined,
          location: club.address,
          website: undefined,
          email: club.mail,
          phone: club.telephone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

    return clubs
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return []
  }
}

// Server function to get all clubs (for site admins)
async function getAllClubs(): Promise<Club[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching all clubs:', error)
      return []
    }

    // Map the database club format to our Club interface
    return (data || []).map(club => ({
      id: club.id,
      name: club.name,
      description: undefined,
      location: club.address,
      website: undefined,
      email: club.mail,
      phone: club.telephone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error in getAllClubs:', error)
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

  // Determine default entity based on source
  let defaultEntityId: number | null = null
  let defaultEntityType: 'fasgba' | 'club' = 'fasgba'

  if (source === 'admin') {
    // Came from admin panel, default to FASGBA
    defaultEntityId = null
    defaultEntityType = 'fasgba'
  } else if (source === 'club-admin' && selectedClubId) {
    // Came from club-admin with specific club selected
    defaultEntityId = selectedClubId
    defaultEntityType = 'club'
  } else if (source === 'club-admin' && userClubs.length > 0) {
    // Came from club-admin but no specific club, use first user club
    defaultEntityId = userClubs[0].id
    defaultEntityType = 'club'
  } else {
    // Default behavior: if site admin, default to FASGBA; if club admin, default to first club
    if (isAdmin) {
      defaultEntityId = null
      defaultEntityType = 'fasgba'
    } else if (userClubs.length > 0) {
      defaultEntityId = userClubs[0].id
      defaultEntityType = 'club'
    }
  }

  return (
    <NewNewsForm 
      user={user}
      userClubs={userClubs}
      isAdmin={isAdmin}
      defaultEntityId={defaultEntityId}
      defaultEntityType={defaultEntityType}
    />
  )
} 