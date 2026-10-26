import type { ReactNode } from "react"
import Link from "next/link"
import { Calendar, Download, ExternalLink, EyeOff, Landmark, Link2, ListOrdered, Loader2, MapPin, Pencil, Undo2, Users, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCrDateRange } from "@/components/chess-results/format"
import { chessResultsUrl } from "@/lib/chess-results/url"
import type { CandidateItem } from "./types"

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <Icon className="h-3.5 w-3.5 shrink-0 text-amber" />
      <span className="truncate">{children}</span>
    </span>
  )
}

interface CandidateRowProps {
  candidate: CandidateItem
  busy: boolean
  onImport: () => void
  onLink: () => void
  onIgnore: () => void
  onRestore: () => void
}

export function CandidateRow({ candidate: c, busy, onImport, onLink, onIgnore, onRestore }: CandidateRowProps) {
  const dates = formatCrDateRange(c.start_date, c.end_date)

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1.5">
        <a
          href={chessResultsUrl(c.tnr)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-1 font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          <span className="break-words">{c.name}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        </a>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {dates && <Meta icon={Calendar}>{dates}</Meta>}
          {c.organizer && <Meta icon={Landmark}>{c.organizer}</Meta>}
          {c.place && <Meta icon={MapPin}>{c.place}</Meta>}
          {c.rounds ? <Meta icon={ListOrdered}>{c.rounds} rondas</Meta> : null}
          {c.players ? <Meta icon={Users}>{c.players} jugadores</Meta> : null}
        </div>
        {c.status === "pending" && c.suggested && (
          <p className="text-xs text-muted-foreground">
            Posible coincidencia: <span className="font-medium text-foreground">{c.suggested.title}</span>
          </p>
        )}
        {c.status === "imported" && c.tournament && (
          <p className="text-xs text-muted-foreground">
            Vinculado a <span className="font-medium text-foreground">{c.tournament.title}</span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />}
        {c.status === "pending" && (
          <>
            <Button size="sm" onClick={onImport} disabled={busy}>
              <Download className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button size="sm" variant="outline" onClick={onLink} disabled={busy}>
              <Link2 className="mr-2 h-4 w-4" />
              Vincular
            </Button>
            <Button size="sm" variant="ghost" onClick={onIgnore} disabled={busy}>
              <EyeOff className="mr-2 h-4 w-4" />
              Ignorar
            </Button>
          </>
        )}
        {c.status === "ignored" && (
          <Button size="sm" variant="outline" onClick={onRestore} disabled={busy}>
            <Undo2 className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
        )}
        {c.status === "imported" && c.tournament && (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/torneos/${c.tournament.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Abrir torneo
            </Link>
          </Button>
        )}
      </div>
    </li>
  )
}
