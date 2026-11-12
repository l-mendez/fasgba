import { Suspense } from "react"
import { Metadata } from "next"

import { PlayerList } from "./components/PlayerList"
import { PageHero } from "@/components/page-hero"
import {
  getCachedLatestRankingData,
  getCachedPublicRankingOptions,
} from "@/lib/rankingStorage"
import { normalizePlayer, selectPlayersPage, sortPlayersByRatingType } from "@/lib/rankingDisplay"
import { TopRanking } from "@/components/home/top-ranking"
import { safe } from "@/lib/utils/safe"
import type { Player } from "@/lib/rankingUtils"
import { pageMetadata } from '@/lib/seo'

// Re-export Player type for any consumers
export type { Player }

export const metadata: Metadata = pageMetadata({
  title: 'Ranking de ajedrez zona sur: mejores jugadores',
  description:
    'Los mejores jugadores de ajedrez de la zona sur del Gran Buenos Aires: ranking oficial FASGBA con ELO estándar, rápido y blitz y búsqueda por jugador o club.',
  path: '/ranking',
})

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

  const initialPlayers: Player[] = latest.players.map(normalizePlayer)
  const topPlayers = selectPlayersPage(sortPlayersByRatingType(initialPlayers, 'standard'), { activeFilter: 'active', pageSize: 10 }).players

  return (
    <>
      <PageHero title="Ranking" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        {/* PlayerList reads search params, so it renders on the client only; the
            fallback puts the top 10 in the HTML for crawlers that don't run JS. */}
        <Suspense
          fallback={
            <div className="container px-4 md:px-6">
              <TopRanking players={topPlayers} />
            </div>
          }
        >
          <PlayerList
            initialPlayers={initialPlayers}
            availableRankings={availableRankings}
          />
        </Suspense>
      </section>
    </>
  );
}
