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

export type GameFill = { result?: string; pgn?: string }

/** What a chess-results game fills on an existing row: a pending result and/or a missing PGN. */
export function gameFill(game: CrGame, current: { result: string | null; pgn?: string | null }): GameFill | null {
  const fill: GameFill = {}
  if ((!current.result || current.result === '*') && game.result !== '*') fill.result = game.result
  if (!current.pgn && game.pgn) fill.pgn = game.pgn
  return fill.result || fill.pgn ? fill : null
}

/** Splits CR games into rows to insert and existing rows to fill. */
export function planGames<T extends { id: number; result: string | null; pgn: string | null }>(
  games: CrGame[],
  existing: Map<string, T>,
  key: (game: CrGame) => string | null,
  row: (game: CrGame) => Record<string, unknown> | null,
) {
  const inserts: Record<string, unknown>[] = []
  const updates: Array<{ id: number; fill: GameFill }> = []
  for (const game of games) {
    const k = key(game)
    if (!k) continue
    const current = existing.get(k)
    const fill = current ? gameFill(game, current) : null
    if (!current) {
      const r = row(game)
      if (r) inserts.push({ ...r, pgn: game.pgn ?? null })
    } else if (fill) {
      updates.push({ id: current.id, fill })
    }
  }
  const pgnsAdded = inserts.filter((r) => r.pgn).length + updates.filter((u) => u.fill.pgn).length
  return { inserts, updates, resultsUpdated: updates.filter((u) => u.fill.result).length, pgnsAdded }
}

export async function applyGameUpdates(db: SupabaseClient, table: 'individual_games' | 'match_games', updates: Array<{ id: number; fill: GameFill }>) {
  for (const u of updates) fail('actualizar partidas', (await db.from(table).update(u.fill).eq('id', u.id)).error)
}
