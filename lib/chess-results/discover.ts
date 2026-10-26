// Discovery half of the weekly job: finds official FASGBA tournaments on
// chess-results and queues them in chess_results_candidates for admin review.
// Never creates tournaments and never touches an admin's 'ignored' decision.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChessResultsCandidateInsert, ChessResultsCandidateRow } from '@/lib/db-types'
import { fail } from './db'
import { searchChessResults } from './fetch'
import { cleanChessResultsName, suggestTournaments, type SiteTournament } from './suggest'

/** Only tournaments starting on or after this date are discovered. */
export const DISCOVERY_FROM = '2025-01-01'
const SEARCHES = [{ organizer: 'FASGBA' }, { name: 'FASGBA' }]

type Metadata = Pick<ChessResultsCandidateRow,
  'tnr' | 'name' | 'start_date' | 'end_date' | 'organizer' | 'place' | 'time_control' | 'rounds' | 'players'>

export interface NewCandidate {
  tnr: number
  name: string
  startDate: string | null
  suggestedTournamentId: number | null
  suggestedTournamentTitle: string | null
}

export interface DiscoverySummary {
  found: number
  new: number
  updated: number
  newCandidates: NewCandidate[]
}

async function searchFasgba(): Promise<Metadata[]> {
  const byTnr = new Map<number, Metadata>()
  for (const search of SEARCHES) {
    for (const r of await searchChessResults({ ...search, from: DISCOVERY_FROM })) {
      byTnr.set(r.tnr, {
        tnr: r.tnr, name: cleanChessResultsName(r.name), start_date: r.startDate, end_date: r.endDate,
        organizer: r.organizer, place: r.place, time_control: r.timeControl, rounds: r.rounds, players: r.players,
      })
    }
  }
  return [...byTnr.values()]
}

export async function discoverCandidates(db: SupabaseClient, sites: SiteTournament[], dryRun: boolean): Promise<DiscoverySummary> {
  const found = await searchFasgba()
  const { data, error } = await db.from('chess_results_candidates').select('*')
  fail('leer candidatos', error)
  const existing = new Map((data as ChessResultsCandidateRow[] ?? []).map((c) => [c.tnr, c]))
  const linked = new Map(sites.filter((s) => s.tnr != null).map((s) => [s.tnr!, s.id]))

  // Next state of every row we know about (found now or already queued).
  const rows = new Map<number, ChessResultsCandidateInsert>()
  for (const c of existing.values()) rows.set(c.tnr, { ...c })
  for (const meta of found) rows.set(meta.tnr, { ...rows.get(meta.tnr), ...meta })
  for (const row of rows.values()) {
    const tournamentId = linked.get(row.tnr)
    if (tournamentId) Object.assign(row, { status: 'imported', tournament_id: tournamentId, suggested_tournament_id: null })
    else row.status ??= 'pending'
  }
  const pending = [...rows.values()].filter((r) => r.status === 'pending')
  const suggestions = suggestTournaments(pending.map((r) => ({ name: r.name, startDate: r.start_date ?? null, endDate: r.end_date ?? null })), sites)
  pending.forEach((row, i) => { row.suggested_tournament_id = suggestions[i] })

  const now = new Date().toISOString()
  const inserts = [...rows.values()].filter((r) => !existing.has(r.tnr))
  // Only changed columns, so a concurrent admin decision (status) isn't overwritten.
  const updates = [...rows.values()].flatMap((r) => {
    const old = existing.get(r.tnr)
    const keys = (Object.keys(r) as Array<keyof ChessResultsCandidateRow>).filter((k) => old && (r[k] ?? null) !== old[k])
    return keys.length ? [{ tnr: r.tnr, patch: Object.fromEntries(keys.map((k) => [k, r[k] ?? null])) }] : []
  })
  if (!dryRun) {
    if (inserts.length) fail('crear candidatos', (await db.from('chess_results_candidates').insert(inserts)).error)
    for (const { tnr, patch } of updates) {
      fail('actualizar candidatos', (await db.from('chess_results_candidates').update({ ...patch, updated_at: now }).eq('tnr', tnr)).error)
    }
  }
  return {
    found: found.length,
    new: inserts.length,
    updated: updates.length,
    newCandidates: inserts.filter((r) => r.status === 'pending').map((r) => ({
      tnr: r.tnr,
      name: r.name,
      startDate: r.start_date ?? null,
      suggestedTournamentId: r.suggested_tournament_id ?? null,
      suggestedTournamentTitle: sites.find((s) => s.id === r.suggested_tournament_id)?.title ?? null,
    })),
  }
}
