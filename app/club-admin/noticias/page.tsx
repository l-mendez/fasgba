import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getClubNews } from "@/lib/clubUtils"

import { Button } from "@/components/ui/button"
import { ClubProvider } from "../context/club-provider"
import { NoticiasContent } from "./noticias-content"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NewNewsButton } from "../components/new-news-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Mark this page as dynamic
export const dynamic = 'force-dynamic'

// Updated interface to include additional author metadata
interface ClubNews {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[]
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
  author_name?: string
  author_email?: string
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

// Expected Club interface (matches ClubProvider context)
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
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

// Function to map database club to expected club format
function mapDbClubToClub(dbClub: DbClub): Club {
  return {
    id: dbClub.id,
    name: dbClub.name,
    description: undefined,
    location: dbClub.address || undefined,
    website: undefined,
    email: dbClub.mail || undefined,
    phone: dbClub.telephone || undefined,
    created_at: new Date().toISOString(), // Default since not in DB
    updated_at: new Date().toISOString(), // Default since not in DB
    address: dbClub.address || null,
    telephone: dbClub.telephone || null,
    mail: dbClub.mail || null,
    schedule: dbClub.schedule || null
  }
}

// Server component to fetch initial data
async function getNewsData(clubId: number): Promise<ClubNews[]> {
  try {
    // Use the clubUtils function which already fetches author information
    return await getClubNews(clubId)
  } catch (error) {
    console.error('Error in getNewsData:', error)
    return []
  }
}

// Server component to get user's clubs
async function getUserClubs(): Promise<{ clubs: Club[], selectedClub: Club | null }> {
  try {
    // Use the proper server client that handles authentication correctly
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { clubs: [], selectedClub: null }
    }

    // Get clubs where user is admin using the admin client for the query
    const adminClient = createAdminClient()
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
      .eq('auth_id', user.id)

    if (adminError) {
      console.error('Error fetching user clubs:', adminError)
      return { clubs: [], selectedClub: null }
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

    const selectedClub = clubs.length > 0 ? clubs[0] : null

    return { clubs, selectedClub }
  } catch (error) {
    console.error('Error in getUserClubs:', error)
    return { clubs: [], selectedClub: null }
  }
}

// Main server component
export default async function ClubAdminNoticiasPage() {
  const { clubs, selectedClub } = await getUserClubs()
  
  // If no clubs, return not found
  if (clubs.length === 0) {
    notFound()
  }

  // Get initial news data
  const initialNews = selectedClub ? await getNewsData(selectedClub.id) : []
    
  return (
    <ClubProvider initialClubs={clubs} initialSelectedClub={selectedClub}>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-terracotta">Noticias</h1>
            <p className="text-muted-foreground">
              Gestiona las noticias publicadas por {selectedClub?.name || 'tu club'}.
            </p>
          </div>
          <NewNewsButton />
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <NoticiasContent 
            initialNews={initialNews} 
            selectedClub={selectedClub}
          />
        </Suspense>
      </div>
    </ClubProvider>
  )
}

