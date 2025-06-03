import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"
import {
  type TournamentDisplay,
  getAllTournamentsForDisplay,
  filterTournamentsByStatus,
  sortTournamentsByDate,
} from "@/lib/tournamentUtils"
import TorneosClient from "./components/torneos-client"

export default async function TorneosPage() {
  let tournaments: TournamentDisplay[] = []
  let error: string | null = null
  
  // Cargar torneos en el servidor
  try {
    const supabase = await createClient()
    const tournamentsData = await getAllTournamentsForDisplay(supabase)
    tournaments = sortTournamentsByDate(tournamentsData, 'asc')
  } catch (err) {
    console.error('Error loading tournaments:', err)
    error = `Error al cargar los torneos: ${err instanceof Error ? err.message : 'Error desconocido'}`
  }

  // Filtrar torneos por estado
  const upcomingTournaments = filterTournamentsByStatus(tournaments, 'upcoming')
  const ongoingTournaments = filterTournamentsByStatus(tournaments, 'ongoing')
  const pastTournaments = filterTournamentsByStatus(tournaments, 'past')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/torneos" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Torneos FASGBA</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Calendario completo de torneos organizados por la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <TorneosClient 
              upcomingTournaments={upcomingTournaments}
              ongoingTournaments={ongoingTournaments}
              pastTournaments={pastTournaments}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

