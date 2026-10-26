// Name matching between chess-results and our DB (players, teams, clubs).

import type { SupabaseClient } from '@supabase/supabase-js'

const STOPWORDS = new Set(['club', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'ajedrez', 'atletico', 'circulo', 'social', 'deportivo', 'a', 'c'])

function tokens(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

/** Order-insensitive key, so "Mayo, Raul" and "Raúl Mayo" match. */
export function nameKey(name: string): string {
  return tokens(name).sort().join(' ')
}

const significant = (name: string) => new Set(tokens(name).filter((t) => !STOPWORDS.has(t)))

/**
 * Best candidate whose significant name tokens contain, or are contained in,
 * the given name's ("Club Atlético Banfield Mayores" → "Club Atlético Banfield",
 * "Claypole Escuela Zárate" → "Claypole Escuela Juan Carlos Zárate").
 * Ties are ambiguous and return null.
 */
export function bestNameMatch<T extends { name: string }>(name: string, candidates: T[]): T | null {
  const target = significant(name)
  let best: T | null = null
  let bestScore = 0
  let tie = false
  for (const candidate of candidates) {
    const other = significant(candidate.name)
    const shared = [...other].filter((t) => target.has(t)).length
    if (shared === 0 || (shared !== other.size && shared !== target.size)) continue
    if (shared > bestScore) { best = candidate; bestScore = shared; tie = false }
    else if (shared === bestScore) tie = true
  }
  return tie ? null : best
}

export interface PlayerInput {
  name: string
  fideId?: string | null
  rating?: number | null
}

/** Maps chess-results players to players.id (by FIDE id, then name), creating the missing ones. */
export async function resolvePlayers(db: SupabaseClient, inputs: PlayerInput[]) {
  const { data, error } = await db.from('players').select('id, full_name, fide_id').range(0, 9999)
  if (error) throw new Error(`Error al leer jugadores: ${error.message}`)
  const byFide = new Map<string, number>()
  const byName = new Map<string, number>()
  for (const p of data ?? []) {
    if (p.fide_id) byFide.set(String(p.fide_id), p.id)
    byName.set(nameKey(p.full_name), p.id)
  }

  const ids = new Map<string, number>() // nameKey → players.id
  const missing = new Map<string, PlayerInput>()
  for (const input of inputs) {
    const key = nameKey(input.name)
    if (!key || ids.has(key)) continue
    const id = (input.fideId && byFide.get(input.fideId)) || byName.get(key)
    if (id) ids.set(key, id)
    else if (!missing.has(key)) missing.set(key, input)
  }

  if (missing.size > 0) {
    const rows = [...missing.values()].map((p) => ({ full_name: p.name, fide_id: p.fideId ?? null, rating: p.rating ?? null }))
    const { data: created, error: insertError } = await db.from('players').insert(rows).select('id, full_name')
    if (insertError) throw new Error(`Error al crear jugadores: ${insertError.message}`)
    for (const p of created ?? []) ids.set(nameKey(p.full_name), p.id)
  }
  return { ids, created: missing.size }
}
