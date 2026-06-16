import { unstable_cache } from "next/cache"

import { ErrorAlert } from "@/components/error-alert"
import { createAdminClient } from "@/lib/supabase/admin"
import { Metadata } from "next"
import {
  type TournamentDisplay,
  getAllTournamentsWithDates,
  transformTournamentToDisplay,
  sortTournamentsByDate,
} from "@/lib/tournamentUtils"
import { TournamentsTabs } from "./components/tournaments-tabs"

// Static content (ISR) — revalidate periodically. Public listing read via the
// non-cookie admin client so the page can be statically prerendered.
export const revalidate = 300

// Generate metadata for better link previews
export const metadata: Metadata = {
  title: 'Torneos FASGBA - Calendario de Competencias',
  description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires. Consulta próximos torneos, torneos en curso y resultados.',
  keywords: ['FASGBA', 'torneos', 'ajedrez', 'competencias', 'calendario', 'federación', 'Buenos Aires', 'inscripción'],
  openGraph: {
    title: 'Torneos FASGBA - Calendario de Competencias',
    description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires. Consulta próximos torneos, torneos en curso y resultados.',
    url: 'https://fasgba.com/torneos',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Torneos FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Torneos FASGBA - Calendario de Competencias',
    description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires.',
    images: ['https://fasgba.com/images/fasgba-logo.png'],
    creator: '@FASGBA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Cache the raw (JSON-serializable) tournament rows. Display transformation
// produces Date objects, so it must run AFTER the cache, not inside it.
const getCachedTournaments = unstable_cache(
  () => getAllTournamentsWithDates(createAdminClient()),
  ['torneos-list'],
  { revalidate: 300, tags: ['torneos'] }
)

// Carga los torneos en el servidor, ordenados por fecha ascendente.
async function getTorneos(): Promise<{ tournaments: TournamentDisplay[]; error: string | null }> {
  try {
    const tournamentsData = (await getCachedTournaments()).map(transformTournamentToDisplay)
    return { tournaments: sortTournamentsByDate(tournamentsData, 'asc'), error: null }
  } catch (err) {
    console.error('Error loading tournaments:', err)
    return {
      tournaments: [],
      error: `Error al cargar los torneos: ${err instanceof Error ? err.message : 'Error desconocido'}`,
    }
  }
}

export default async function TorneosPage() {
  const { tournaments, error } = await getTorneos()

  return (
    <>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {error && <ErrorAlert message={error} className="mb-6" />}

            <TournamentsTabs tournaments={tournaments} />
          </div>
        </section>
    </>
  )
}

