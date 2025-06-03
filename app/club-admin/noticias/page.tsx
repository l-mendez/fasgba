import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

import { Button } from "@/components/ui/button"
import { ClubProvider } from "../context/club-provider"
import { NoticiasContent } from "./noticias-content"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

// Define el tipo para noticias según la API
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
    created_at: new Date().toISOString(), // Default since not in DB
    updated_at: new Date().toISOString() // Default since not in DB
  }
}

// Server component to fetch initial data
async function getNewsData(clubId: number): Promise<ClubNews[]> {
  try {
    const adminClient = createAdminClient()
    
    // Get news for the club - removed the profiles join since profiles table doesn't exist
    const { data: newsData, error } = await adminClient
      .from('news')
      .select('*')
      .eq('club_id', clubId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching news:', error)
      return []
    }

    // Transform the data to match the expected format
    return (newsData || []).map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      image: item.image,
      extract: item.extract,
      text: item.text,
      tags: item.tags || [],
      created_by_auth_id: item.created_by_auth_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      author_name: undefined, // No profiles table available
      author_email: undefined // No profiles table available
    }))
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
      console.log('No authenticated user found:', userError?.message)
      return { clubs: [], selectedClub: null }
    }

    console.log('Found authenticated user:', user.id, user.email)

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

    console.log('Found admin data:', adminData)

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

    console.log('Final clubs result:', clubs.length, 'clubs found')

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
          <Button asChild className="w-fit">
            <Link href="/club-admin/noticias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Noticia
            </Link>
          </Button>
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

