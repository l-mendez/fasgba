import Link from "next/link"
import { Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { ClubsTable } from "@/components/clubs-table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
  adminCount?: number
  delegado?: string
}

// Server-side function to fetch clubs data
async function fetchClubs(): Promise<Club[]> {
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

    // Fetch all clubs
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true })

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError)
      throw new Error('Error al obtener los clubes')
    }

    if (!clubsData) {
      return []
    }

    // Fetch admin counts and delegado information for each club
    const clubsWithStats = await Promise.all(
      clubsData.map(async (club) => {
        try {
          // Get admin count for this club using service role client
          const { count: adminCount, error: adminCountError } = await supabaseAdmin
            .from('club_admins')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)

          if (adminCountError) {
            console.warn(`Could not fetch admin count for club ${club.id}, using 0 as default:`, {
              message: adminCountError.message || 'Unknown error',
              code: adminCountError.code || 'No code'
            })
            // Don't continue processing if there's an error, just use defaults
            return {
              ...club,
              adminCount: 0,
              delegado: undefined
            }
          }

          // Get the first admin (delegado) for this club using service role client
          const { data: clubAdminsData, error: clubAdminsError } = await supabaseAdmin
            .from('club_admins')
            .select('auth_id')
            .eq('club_id', club.id)
            .limit(1)

          if (clubAdminsError) {
            console.warn(`Could not fetch club admins for club ${club.id}, using defaults:`, {
              message: clubAdminsError.message || 'Unknown error',
              code: clubAdminsError.code || 'No code'
            })
            // Continue with what we have
            return {
              ...club,
              adminCount: adminCount || 0,
              delegado: undefined
            }
          }

          let delegado: string | undefined = undefined

          if (clubAdminsData && clubAdminsData.length > 0) {
            try {
              const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(clubAdminsData[0].auth_id)
              
              if (!userError && userData.user) {
                delegado = userData.user.email || undefined
              } else if (userError) {
                console.warn(`Failed to fetch user data for admin ${clubAdminsData[0].auth_id}:`, userError.message)
              }
            } catch (error) {
              console.warn(`Failed to fetch user data for admin ${clubAdminsData[0].auth_id}:`, error)
            }
          }

          return {
            ...club,
            adminCount: adminCount || 0,
            delegado
          }
        } catch (error) {
          console.warn(`Error processing club ${club.id}, using defaults:`, error instanceof Error ? error.message : 'Unknown error')
          return {
            ...club,
            adminCount: 0,
            delegado: undefined
          }
        }
      })
    )

    return clubsWithStats
  } catch (error) {
    console.error('Error fetching clubs:', error)
    throw error
  }
}

export default async function AdminClubesPage() {
  let clubs: Club[] = []
  let error: string | null = null

  try {
    clubs = await fetchClubs()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los clubes"
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8 pb-16 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Clubes</h1>
          <p className="text-muted-foreground">Gestiona los clubes afiliados a FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/clubes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Club
          </Link>
        </Button>
      </div>

      <ClubsTable initialClubs={clubs} />
    </div>
  )
}