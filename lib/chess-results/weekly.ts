// Weekly chess-results job (Vercel cron + admin "Buscar ahora"):
// 1. queue newly discovered FASGBA tournaments for admin approval;
// 2. import missing data into tournaments already linked to chess-results.
// Server-only: uses the service-role client.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateTorneosCache } from '@/lib/cache/torneos'
import { fail } from './db'
import { discoverCandidates, type DiscoverySummary } from './discover'
import { readOnlyClient } from './dry-run'
import { fetchChessResultsTournament } from './fetch'
import { notifyNewCandidates, type NotifyResult } from './notify'
import type { SiteTournament } from './suggest'
import { syncTournamentFromChessResults, type SyncReport } from './sync'

/** Results can still be corrected for a while after the last round. */
const SYNC_GRACE_DAYS = 14
/** Don't start another tournament with less time left than this. */
const MIN_TIME_PER_SYNC_MS = 20_000

export interface RunOptions {
  /** No database writes; the summary reports what would be written. */
  dryRun?: boolean
  /** Time budget in ms, measured from the start of the run. */
  deadlineMs?: number
  /** Email site admins about newly queued candidates (scheduled cron only). */
  notifyAdmins?: boolean
}

export interface SyncedTournament extends SyncReport {
  title: string
  tnr: number
}

export interface RunError {
  step: 'discovery' | 'sync'
  tournamentId?: number
  tnr?: number
  message: string
}

export interface ChessResultsRunSummary {
  dryRun: boolean
  discovered: DiscoverySummary | null
  synced: SyncedTournament[]
  /** Linked tournaments left for the next run because the time budget ran out. */
  deferred: Array<{ tournamentId: number; title: string; tnr: number }>
  /** Linked tournaments not synced because they ended long before their last sync. */
  upToDate: number
  errors: RunError[]
  /** Admin email about new candidates; null when none was due. */
  notified: NotifyResult | null
  changed: boolean
  durationMs: number
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function loadSiteTournaments(db: SupabaseClient): Promise<SiteTournament[]> {
  const { data, error } = await db.from('tournaments')
    .select('id, title, chess_results_tnr, chess_results_synced_at, tournamentdates(event_date)')
  fail('leer torneos', error)
  return (data ?? []).map((t) => {
    const dates = (t.tournamentdates as Array<{ event_date: string }>).map((d) => d.event_date).sort()
    return {
      id: t.id, title: t.title, tnr: t.chess_results_tnr, syncedAt: t.chess_results_synced_at,
      start: dates[0] ?? null, end: dates.at(-1) ?? null,
    }
  })
}

/** Linked tournaments worth syncing: never synced first, then the stalest. */
export function planSync(sites: SiteTournament[]): { queue: SiteTournament[]; upToDate: number } {
  const linked = sites.filter((s) => s.tnr != null)
  const settled = (s: SiteTournament) => !!s.syncedAt && !!s.end &&
    new Date(s.syncedAt).getTime() > new Date(`${s.end}T00:00:00Z`).getTime() + SYNC_GRACE_DAYS * 86_400_000
  const queue = linked.filter((s) => !settled(s))
    .sort((a, b) => (a.syncedAt ?? '').localeCompare(b.syncedAt ?? ''))
  return { queue, upToDate: linked.length - queue.length }
}

export async function runChessResultsSync(
  { dryRun = false, deadlineMs = 50_000, notifyAdmins = false }: RunOptions = {},
): Promise<ChessResultsRunSummary> {
  const startedAt = Date.now()
  const admin = createAdminClient()
  const db = dryRun ? readOnlyClient(admin) : admin
  const errors: RunError[] = []
  const sites = await loadSiteTournaments(db)

  let discovered: DiscoverySummary | null = null
  try {
    discovered = await discoverCandidates(db, sites, dryRun)
  } catch (error) {
    errors.push({ step: 'discovery', message: message(error) })
  }
  const newCandidates = discovered?.newCandidates ?? []
  const notified = notifyAdmins && !dryRun && newCandidates.length
    ? await notifyNewCandidates(admin, newCandidates)
    : null

  const { queue, upToDate } = planSync(sites)
  const synced: SyncedTournament[] = []
  const deferred: ChessResultsRunSummary['deferred'] = []
  for (const site of queue) {
    const tnr = site.tnr!
    if (Date.now() - startedAt > deadlineMs - MIN_TIME_PER_SYNC_MS) {
      deferred.push({ tournamentId: site.id, title: site.title, tnr })
      continue
    }
    try {
      const cr = await fetchChessResultsTournament(tnr)
      const report = await syncTournamentFromChessResults(db, site.id, cr)
      synced.push({ ...report, title: site.title, tnr })
    } catch (error) {
      errors.push({ step: 'sync', tournamentId: site.id, tnr, message: message(error) })
    }
  }

  const changed = synced.some((s) => s.changed)
  if (changed && !dryRun) revalidateTorneosCache()
  return { dryRun, discovered, synced, deferred, upToDate, errors, notified, changed, durationMs: Date.now() - startedAt }
}
