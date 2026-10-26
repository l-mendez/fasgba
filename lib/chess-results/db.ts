// Shared DB steps for the chess-results sync (individual and team).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CrGame } from './types'

export function fail(action: string, error: { message: string } | null): void {
  if (error) throw new Error(`Error al ${action}: ${error.message}`)
}

/** Ensures a rounds row per round number; returns round_number → rounds.id. */
export async function ensureRounds(db: SupabaseClient, tournamentId: number, numbers: number[]) {
  const { data, error } = await db.from('rounds').select('id, round_number').eq('tournament_id', tournamentId)
  fail('leer rondas', error)
  const ids = new Map<number, number>((data ?? []).map((r) => [r.round_number, r.id]))
  const missing = numbers.filter((n) => !ids.has(n)).map((round_number) => ({ tournament_id: tournamentId, round_number }))
  if (missing.length) {
    const { data: created, error: insertError } = await db.from('rounds').insert(missing).select('id, round_number')
    fail('crear rondas', insertError)
    for (const r of created ?? []) ids.set(r.round_number, r.id)
  }
  return { ids, created: missing.length }
}

/** Splits CR games into rows to insert and pending results to fill. */
export function planGames<T extends { id: number; result: string | null }>(
  games: CrGame[],
  existing: Map<string, T>,
  key: (game: CrGame) => string | null,
  row: (game: CrGame) => Record<string, unknown> | null,
) {
  const inserts: Record<string, unknown>[] = []
  const updates: Array<{ id: number; result: string }> = []
  for (const game of games) {
    const k = key(game)
    if (!k) continue
    const current = existing.get(k)
    if (!current) {
      const r = row(game)
      if (r) inserts.push(r)
    } else if ((!current.result || current.result === '*') && game.result !== '*') {
      updates.push({ id: current.id, result: game.result })
    }
  }
  return { inserts, updates }
}

export async function applyResultUpdates(db: SupabaseClient, table: 'individual_games' | 'match_games', updates: Array<{ id: number; result: string }>) {
  for (const u of updates) fail('actualizar resultados', (await db.from(table).update({ result: u.result }).eq('id', u.id)).error)
}
