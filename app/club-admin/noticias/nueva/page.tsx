import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

import { NewNewsForm } from "./new-news-form"

// Force dynamic rendering since we use cookies
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

// Database Club interface (matches actual schema)
interface DbClub {
  id: number
  name: string
  address?: string
  telephone?: string
  mail?: string
  schedule?: string
}

// Function to map database club to expected club format
function mapDbClubToClub(dbClub: DbClub): Club {
  return {
    id: dbClub.id,
    name: dbClub.name,
    description: undefined,
    location: dbClub.address,
    website: undefined,
    email: dbClub.mail,
    phone: dbClub.telephone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
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

// Server function to get user's clubs
async function getUserClubs(userId: string): Promise<Club[]> {
  try {
      const adminClient = createAdminClient()
      
    // Get clubs where user is admin
    const { data: adminData, error: adminError } = await adminClient
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
    const dbClubs: DbClub[] = (adminData || [])
      .filter(item => item.clubs)
      .map(item => {
        const club = item.clubs as any
        return {
          id: club.id,
          name: club.name,
          address: club.address,
          telephone: club.telephone,
          mail: club.mail,
          schedule: club.schedule
        }
      })

    // Convert to expected Club format
    const clubs: Club[] = dbClubs.map(mapDbClubToClub)

    return clubs
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return []
  }
}

// Server component
export default async function NuevaNoticiaPage() {
  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    notFound()
  }

  // Get user's clubs
  const clubs = await getUserClubs(user.id)
  if (clubs.length === 0) {
    notFound()
  }

  // Select the first club as default
  const selectedClub = clubs[0]

  return <NewNewsForm selectedClub={selectedClub} clubs={clubs} />
}

