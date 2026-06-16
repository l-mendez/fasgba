import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { ClubsTable } from "@/components/clubs-table"
import { ErrorAlert } from "@/components/error-alert"

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

    // Fetch every club_admin row once, then derive per-club admin counts and the
    // first admin (delegado) in memory — avoids 3 queries per club (N+1).
    const adminCountByClub = new Map<number, number>()
    const firstAdminByClub = new Map<number, string>()

    const { data: clubAdmins, error: clubAdminsError } = await supabaseAdmin
      .from('club_admins')
      .select('club_id, auth_id')

    if (clubAdminsError) {
      console.warn('Could not fetch club admins, using defaults:', clubAdminsError.message)
    } else {
      for (const { club_id, auth_id } of clubAdmins || []) {
        adminCountByClub.set(club_id, (adminCountByClub.get(club_id) || 0) + 1)
        if (!firstAdminByClub.has(club_id)) firstAdminByClub.set(club_id, auth_id)
      }
    }

    // Resolve delegado emails for the unique first-admins once, in parallel.
    const delegadoIds = [...new Set(firstAdminByClub.values())]
    const emailByAuthId = new Map<string, string>()

    await Promise.all(delegadoIds.map(async (authId) => {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(authId)
        if (!userError && userData.user?.email) {
          emailByAuthId.set(authId, userData.user.email)
        } else if (userError) {
          console.warn(`Failed to fetch user data for admin ${authId}:`, userError.message)
        }
      } catch (error) {
        console.warn(`Failed to fetch user data for admin ${authId}:`, error)
      }
    }))

    return clubsData.map((club) => {
      const firstAdmin = firstAdminByClub.get(club.id)
      return {
        ...club,
        adminCount: adminCountByClub.get(club.id) || 0,
        delegado: firstAdmin ? emailByAuthId.get(firstAdmin) : undefined,
      }
    })
  } catch (error) {
    console.error('Error fetching clubs:', error)
    throw error
  }
}

export default function AdminClubesPage() {
  return (
    <div className="flex flex-col gap-8 p-8 pb-16 md:pb-8">
      <AdminPageHeader
        title="Clubes"
        subtitle="Gestiona los clubes afiliados a FASGBA."
        action={
          <Button asChild>
            <Link href="/admin/clubes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Club
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<AdminContentSkeleton rows={6} filters={false} />}>
        <AdminClubesContent />
      </Suspense>
    </div>
  )
}

async function AdminClubesContent() {
  let clubs: Club[] = []
  let error: string | null = null

  try {
    clubs = await fetchClubs()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los clubes"
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return <ClubsTable initialClubs={clubs} />
}
