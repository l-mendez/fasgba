// Name matching between chess-results and our DB (players, teams, clubs).

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

// "Huanca Gaspar, Franco" ↔ "Huanca Gaspar, Franco Alberto": same surname and
// one list of given names starts with the other. Only "Surname, Given" names.
export function splitName(full: string) {
  const [surname, given] = full.split(',')
  return given === undefined ? null : { surname: tokens(surname).join(' '), given: tokens(given) }
}

export function extendsGiven(a: string[], b: string[]): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length > 0 && short.every((t, i) => long[i] === t)
}
