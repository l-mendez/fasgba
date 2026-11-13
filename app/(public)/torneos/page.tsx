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
import { PageHero } from "@/components/page-hero"
import { JsonLd } from "@/components/json-ld"
import { collectionPageJsonLd, pageMetadata } from '@/lib/seo'

// Cached indefinitely, purged by revalidateTorneosCache on mutation. Public
// listing read via the non-cookie admin client so the page can be statically
// prerendered.
export const revalidate = false

// Generate metadata for better link previews
export const metadata: Metadata = pageMetadata({
  title: 'Torneos de ajedrez en zona sur',
  description:
    'Torneos de ajedrez en la zona sur del Gran Buenos Aires: calendario FASGBA de torneos individuales y por equipos, inscripción, resultados y partidas.',
  path: '/torneos',
})

// Cache the raw (JSON-serializable) tournament rows. Display transformation
// produces Date objects, so it must run AFTER the cache, not inside it.
const getCachedTournaments = unstable_cache(
  () => getAllTournamentsWithDates(createAdminClient()),
  ['torneos-list'],
  { revalidate: false, tags: ['torneos'] }
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

  // Newest first, so crawlers see the current calendar before the archive.
  const items = [...tournaments].reverse().map((t) => ({ name: t.title, path: `/torneos/${t.id}` }))

  return (
    <>
      <JsonLd data={collectionPageJsonLd({ name: "Torneos de ajedrez en zona sur", path: "/torneos", items })} />
      <PageHero title="Torneos" />

        <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
          <div className="container px-4 md:px-6">
            {error && <ErrorAlert message={error} className="mb-6" />}

            <TournamentsTabs tournaments={tournaments} />
          </div>
        </section>
    </>
  )
}

