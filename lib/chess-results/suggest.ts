// Suggests which existing site tournament a discovered chess-results
// tournament probably is. Conservative on purpose: a missing suggestion only
// costs the admin a search, a wrong one gets the wrong tournament synced.

import { bestNameMatch } from './match'

export interface SiteTournament {
  id: number
  title: string
  tnr: number | null
  syncedAt: string | null
  /** First and last tournamentdates.event_date (YYYY-MM-DD), if any. */
  start: string | null
  end: string | null
}

export interface DatedName {
  name: string
  startDate: string | null
  endDate: string | null
}

const DATE_TOLERANCE_DAYS = 14
const DAY_MS = 86_400_000

/** Decodes numeric entities chess-results leaves without ';' (e.g. "&#x1F3C6 "). */
export function cleanChessResultsName(name: string): string {
  return name
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .trim()
}

// Drop words every federation tournament shares and split "SUPRA50" → "SUPRA 50".
const comparable = (name: string) => name
  .replace(/\b(fasgba|torneo)\b/gi, ' ')
  .replace(/([a-z])(\d)/gi, '$1 $2')
  .replace(/(\d)([a-z])/gi, '$1 $2')

const time = (date: string) => new Date(`${date}T00:00:00Z`).getTime()

/** True when both date ranges overlap or are at most DATE_TOLERANCE_DAYS apart. */
function datesClose(cr: DatedName, site: SiteTournament): boolean {
  if (!cr.startDate || !site.start || !site.end) return false
  const gap = Math.max(time(cr.startDate) - time(site.end), time(site.start) - time(cr.endDate ?? cr.startDate))
  return gap <= DATE_TOLERANCE_DAYS * DAY_MS
}

/**
 * Maps each chess-results tournament (by index) to the unlinked site
 * tournament with close dates and a matching name. Site tournaments claimed
 * by more than one chess-results tournament are ambiguous and dropped.
 */
export function suggestTournaments(crs: DatedName[], sites: SiteTournament[]): Array<number | null> {
  const unlinked = sites.filter((s) => s.tnr == null)
  const picks = crs.map((cr) => {
    const options = unlinked.filter((s) => datesClose(cr, s)).map((s) => ({ id: s.id, name: comparable(s.title) }))
    return bestNameMatch(comparable(cr.name), options)?.id ?? null
  })
  return picks.map((id) => (id != null && picks.filter((other) => other === id).length === 1 ? id : null))
}
