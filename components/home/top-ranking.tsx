import Link from "next/link"

import { RatingChange } from "@/components/rating-change"
import type { Player } from "@/lib/rankingUtils"

// Top active players by standard rating; each row opens the ranking filtered to that player
export function TopRanking({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">El ranking no está disponible en este momento.</p>
  }

  return (
    <ol className="grid gap-x-8 rounded-lg border border-amber/20 bg-background p-2 md:grid-flow-col md:grid-cols-2 md:grid-rows-5">
      {players.map((player, index) => (
        <li key={player.id || player.position} className="border-b border-amber/15 last:border-b-0 md:[&:nth-child(5)]:border-b-0">
          <Link
            href={`/ranking?search=${encodeURIComponent(player.name)}`}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-amber/10"
          >
            <span className="w-6 shrink-0 text-right text-lg font-bold text-amber">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {player.title && <span className="mr-1 text-terracotta">{player.title}</span>}
                {player.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{player.club}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5">
              <RatingChange value={player.changes?.ratings ? player.changes.ratings.standard : player.changes?.points} />
              <span className="font-semibold tabular-nums">{Math.round(player.ratings.standard ?? 0)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
