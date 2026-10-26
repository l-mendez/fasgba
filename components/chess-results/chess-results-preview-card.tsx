import type { ReactNode } from "react"
import { AlertTriangle, Calendar, ExternalLink, Landmark, ListOrdered, MapPin, Swords, Timer, User, Users, type LucideIcon } from "lucide-react"

import type { ChessResultsPreview } from "@/lib/tournament/chess-results-dto"
import { formatCrDateRange } from "./format"

function Item({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

/** What an import would bring from chess-results (details + counts). */
export function ChessResultsPreviewCard({ preview }: { preview: ChessResultsPreview }) {
  const { details, counts } = preview
  if (!details || !counts) return null
  const dates = formatCrDateRange(details.startDate, details.endDate)
  const rounds = details.rounds ? `${counts.rounds} de ${details.rounds}` : String(counts.rounds)

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
      <div className="space-y-1.5">
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-1 font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          <span className="break-words">{details.name}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        </a>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {details.isTeam ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {details.isTeam ? "Por equipos" : "Individual"}
          </span>
          {details.system && (
            <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">{details.system}</span>
          )}
        </div>
      </div>

      <ul className="space-y-1.5 text-muted-foreground">
        {dates && <Item icon={Calendar}>{dates}</Item>}
        {details.place && <Item icon={MapPin}>{details.place}</Item>}
        {details.organizer && <Item icon={Landmark}>{details.organizer}</Item>}
        {details.timeControl && <Item icon={Timer}>{details.timeControl}</Item>}
      </ul>

      <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">{details.isTeam ? "Equipos" : "Jugadores"}</dt>
          <dd className="font-semibold tabular-nums">{details.isTeam ? counts.teams : counts.players}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><ListOrdered className="h-3 w-3" />Rondas</dt>
          <dd className="font-semibold tabular-nums">{rounds}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Swords className="h-3 w-3" />Partidas</dt>
          <dd className="font-semibold tabular-nums">{counts.games}</dd>
        </div>
      </dl>

      {preview.dates.length === 0 && (
        <p className="flex items-start gap-2 rounded-md border border-amber/50 bg-amber/10 p-2 text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          No tiene fechas en chess-results: crealo a mano y pegá el link en el formulario.
        </p>
      )}
    </div>
  )
}
