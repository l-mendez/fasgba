"use client"

import { useEffect, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type TournamentDisplay,
  getTournamentStatus,
  getTournamentStatusAt,
} from "@/lib/tournamentUtils"
import { TOURNAMENT_STATUS, type TournamentStatus } from "@/lib/utils/constants"
import { TournamentCard } from "./tournament-card"

type TabConfig = {
  status: TournamentStatus
  label: string
  shortLabel: string
  emptyMessage: string
}

const TABS: readonly TabConfig[] = [
  {
    status: TOURNAMENT_STATUS.UPCOMING,
    label: "Próximos Torneos",
    shortLabel: "Próximos",
    emptyMessage: "No hay torneos próximos programados en este momento.",
  },
  {
    status: TOURNAMENT_STATUS.ONGOING,
    label: "Torneos en Curso",
    shortLabel: "En Curso",
    emptyMessage: "No hay torneos en curso en este momento.",
  },
  {
    status: TOURNAMENT_STATUS.PAST,
    label: "Torneos Pasados",
    shortLabel: "Pasados",
    emptyMessage: "No hay torneos pasados registrados.",
  },
]

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

export function TournamentsTabs({ tournaments }: { tournaments: TournamentDisplay[] }) {
  // The server HTML buckets tournaments using the flags baked at render time.
  // Under ISR that snapshot can be up to `revalidate` stale, so once mounted we
  // recompute each tournament's status from its raw dates against the live clock.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])

  const statusOf = (t: TournamentDisplay) =>
    now === null ? getTournamentStatus(t) : getTournamentStatusAt(t, now)

  const groups = TABS.map((tab) => ({
    ...tab,
    tournaments: tournaments.filter((t) => statusOf(t) === tab.status),
  }))

  return (
    <Tabs defaultValue={groups[0].status} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted border border-amber/20 mb-8">
        {groups.map(({ status, label, shortLabel, tournaments }) => (
          <TabsTrigger
            key={status}
            value={status}
            className="data-[state=active]:bg-amber data-[state=active]:text-white"
          >
            <span className="hidden sm:inline">{label} ({tournaments.length})</span>
            <span className="sm:hidden">{shortLabel} ({tournaments.length})</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {groups.map(({ status, emptyMessage, tournaments }) => (
        <TabsContent key={status} value={status}>
          {tournaments.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((torneo) => (
                <TournamentCard key={torneo.id} torneo={torneo} status={status} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
