import { Suspense } from "react"
import { Metadata } from "next"

import { PlayerList } from "./components/PlayerList"
import { PageHero } from "@/components/page-hero"
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

function LoadingState() {
  return (
    <div className="container px-4 md:px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded-md w-full max-w-md mx-auto" />
        <div className="h-96 bg-muted rounded-md w-full" />
      </div>
    </div>
  );
}

// The ranking data is identical for everyone, so the page is a static shell and
// PlayerList (client) fetches the selected ranking from the CDN-cacheable
// /api/ranking endpoints, keeping search/filter/sort/pagination on the client.
export default function RankingPage() {
  return (
    <>
      <PageHero
        title="Ranking FASGBA"
        subtitle="Clasificación oficial de jugadores de la Federación de Ajedrez del Sur del Gran Buenos Aires"
      />
      <section className="w-full py-12 md:py-24 lg:py-32">
        <Suspense fallback={<LoadingState />}>
          <PlayerList />
        </Suspense>
      </section>
    </>
  );
}
