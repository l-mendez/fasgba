import { Metadata } from "next"

import { PlayerList } from "./components/PlayerList"
import { PageHero } from "@/components/page-hero"
import {
  getCachedLatestRankingData,
  getCachedPublicRankingOptions,
} from "@/lib/rankingStorage"
import { normalizePlayer } from "@/lib/rankingDisplay"
import type { Player } from "@/lib/rankingUtils"

// Re-export Player type for any consumers
export type { Player }

export const metadata: Metadata = {
  title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
  description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires. Rankings actualizados con estadísticas completas.',
  keywords: ['FASGBA', 'ranking', 'ajedrez', 'clasificación', 'jugadores', 'federación', 'Buenos Aires'],
  openGraph: {
    title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires. Rankings actualizados con estadísticas completas.',
    url: 'https://fasgba.com/ranking',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Ranking FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ranking FASGBA - Clasificación Oficial de Jugadores',
    description: 'Consulta la clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires.',
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

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(label, error)
    return fallback
  }
}

// The ranking data is identical for everyone, so the page reads the cached
// ranking helpers directly and ships the latest ranking + the available-ranking
// options to the client island. This keeps the route statically cacheable and,
// crucially, lets revalidatePath('/ranking') purge it deterministically on
// upload — something a CDN-edge-cached /api response cannot guarantee.
// Search/filter/sort/pagination stay on the client; selecting a *past* ranking
// (the rare case) falls back to a client fetch of that specific file.
export default async function RankingPage() {
  const [latest, availableRankings] = await Promise.all([
    safe(getCachedLatestRankingData, { players: [] }, "Error fetching latest ranking:"),
    safe(getCachedPublicRankingOptions, [], "Error fetching ranking options:"),
  ])

  const initialPlayers: Player[] = ((latest.players as unknown[]) || []).map(normalizePlayer)

  return (
    <>
      <PageHero
        title="Ranking FASGBA"
        subtitle="Clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires"
      />
      <section className="w-full py-12 md:py-24 lg:py-32">
        <PlayerList
          initialPlayers={initialPlayers}
          availableRankings={availableRankings}
        />
      </section>
    </>
  );
}
