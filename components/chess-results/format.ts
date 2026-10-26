import { toast } from "sonner"

import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import type { SyncReport } from "@/lib/tournament/chess-results-dto"

/** "dd/mm/aaaa" or "dd/mm/aaaa – dd/mm/aaaa" for YYYY-MM-DD dates (null when unknown). */
export function formatCrDateRange(start: string | null, end: string | null): string | null {
  if (!start) return end ? formatArgentinaDateOnly(end) : null
  if (!end || end === start) return formatArgentinaDateOnly(start)
  return `${formatArgentinaDateOnly(start)} – ${formatArgentinaDateOnly(end)}`
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** One-line Spanish summary of what a chess-results import/sync wrote. */
export function describeSyncReport(report: SyncReport): string {
  const parts = [
    report.playersCreated && plural(report.playersCreated, "jugador nuevo", "jugadores nuevos"),
    report.registrationsCreated && plural(report.registrationsCreated, "inscripción", "inscripciones"),
    report.teamsLinked && plural(report.teamsLinked, "equipo inscripto", "equipos inscriptos"),
    report.roundsCreated && plural(report.roundsCreated, "ronda", "rondas"),
    report.matchesCreated && plural(report.matchesCreated, "encuentro", "encuentros"),
    report.gamesCreated && plural(report.gamesCreated, "partida", "partidas"),
    report.resultsUpdated && plural(report.resultsUpdated, "resultado actualizado", "resultados actualizados"),
    report.pgnsAdded && plural(report.pgnsAdded, "PGN", "PGN"),
  ].filter(Boolean)
  return parts.length ? `Se agregaron: ${parts.join(", ")}.` : "Ya estaba al día; no hubo cambios."
}

/** Toast with the report; warns about chess-results teams that couldn't be matched to a club. */
export function toastSyncReport(title: string, report: SyncReport, action?: { label: string; onClick: () => void }) {
  const description = describeSyncReport(report)
  if (report.unmatchedTeams.length) {
    toast.warning(title, {
      description: `${description} Equipos sin club asignado (cargalos a mano): ${report.unmatchedTeams.join(", ")}.`,
      duration: 15000,
      action,
    })
  } else {
    toast.success(title, { description, duration: 8000, action })
  }
}
