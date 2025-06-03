import Link from "next/link"
import { Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

import { Button } from "@/components/ui/button"
import { TournamentsTable } from "@/components/tournaments-table"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tournament type based on the API response format
interface Tournament {
  id: string
  title: string  
  description?: string | null
  time?: string | null
  place?: string | null
  location?: string | null
  rounds?: number | null
  pace?: string | null
  inscription_details?: string | null
  cost?: string | null
  prizes?: string | null
  image?: string | null
  start_date: Date
  end_date: Date | null
  formatted_start_date: string
  formatted_end_date?: string | null
  is_upcoming: boolean
  is_ongoing: boolean
  is_past: boolean
  status: "upcoming" | "ongoing" | "past"
  participants?: number
  created_by_club_id?: number | null
  club?: {
    id: number
    name: string
  } | null
}

// Server-side function to fetch tournaments data
async function fetchTournaments(): Promise<Tournament[]> {
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

    // Fetch all tournaments with club information and tournament dates
    const { data: tournamentsData, error: tournamentsError } = await supabase
      .from('tournaments')
      .select(`
        id,
        title,
        description,
        time,
        place,
        location,
        rounds,
        pace,
        inscription_details,
        cost,
        prizes,
        image,
        created_by_club_id,
        clubs(id, name),
        tournamentdates(id, tournament_id, event_date)
      `)
      .order('id', { ascending: false })

    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError)
      throw new Error('Error al obtener los torneos')
    }

    if (!tournamentsData) {
      return []
    }

    // Transform the tournaments data to match our Tournament interface
    const now = new Date()
    const transformedTournaments: Tournament[] = tournamentsData.map((tournament: any) => {
      // Get dates from tournamentdates array
      const eventDates = tournament.tournamentdates?.map((date: any) => new Date(date.event_date)) || []
      eventDates.sort((a: Date, b: Date) => a.getTime() - b.getTime()) // Sort dates
      
      const startDate = eventDates.length > 0 ? eventDates[0] : new Date()
      const endDate = eventDates.length > 1 ? eventDates[eventDates.length - 1] : null
      
      // Determine status based on dates
      let status: "upcoming" | "ongoing" | "past" = "upcoming"
      let is_upcoming = false
      let is_ongoing = false
      let is_past = false
      
      if (eventDates.length > 0) {
        if (endDate && endDate < now) {
          status = "past"
          is_past = true
        } else if (startDate <= now && (!endDate || endDate >= now)) {
          status = "ongoing"
          is_ongoing = true
        } else {
          status = "upcoming"
          is_upcoming = true
        }
      }

      // Format dates for display
      const formatted_start_date = startDate.toLocaleDateString('es-AR')
      const formatted_end_date = endDate ? endDate.toLocaleDateString('es-AR') : null
      
      return {
        id: tournament.id.toString(),
        title: tournament.title || 'Sin título',
        description: tournament.description,
        time: tournament.time,
        place: tournament.place,
        location: tournament.location || 'Ubicación no especificada',
        rounds: tournament.rounds,
        pace: tournament.pace,
        inscription_details: tournament.inscription_details,
        cost: tournament.cost,
        prizes: tournament.prizes,
        image: tournament.image,
        start_date: startDate,
        end_date: endDate,
        formatted_start_date,
        formatted_end_date,
        is_upcoming,
        is_ongoing,
        is_past,
        status,
        participants: 0, // We don't have participants count in this query, can be extended later
        created_by_club_id: tournament.created_by_club_id,
        club: tournament.clubs ? { id: tournament.clubs.id, name: tournament.clubs.name } : null
      }
    })

    return transformedTournaments
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    throw error
  }
}

export default async function AdminTorneosPage() {
  let tournaments: Tournament[] = []
  let error: string | null = null

  try {
    tournaments = await fetchTournaments()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los torneos"
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
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Torneos</h1>
          <p className="text-muted-foreground">Gestiona los torneos y competiciones de FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/torneos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Link>
        </Button>
      </div>

      <TournamentsTable initialTournaments={tournaments} />
    </div>
  )
}

