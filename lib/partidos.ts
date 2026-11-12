import { normalizeForSearch } from '@/lib/countries'

// Partidos with enough affiliated clubs for a landing page (/ajedrez/<slug>).
// `localities` are matched against club addresses and tournament venues;
// `rankingClubs` are the club codes used in the ranking files.
export type Partido = {
  slug: string
  name: string
  localities: string[]
  rankingClubs: string[]
}

export const PARTIDOS: Partido[] = [
  {
    slug: 'avellaneda',
    name: 'Avellaneda',
    localities: ['Avellaneda', 'Wilde', 'Villa Domínico', 'Sarandí', 'Dock Sud', 'Piñeyro'],
    rankingClubs: ['CAI', 'RAC', 'CWA', 'ISP'],
  },
  {
    slug: 'lanus',
    name: 'Lanús',
    localities: ['Lanús', 'Remedios de Escalada', 'Valentín Alsina', 'Gerli', 'Monte Chingolo'],
    rankingClubs: ['CAE', 'B1M', 'UNLa', 'ARL', 'IAS'],
  },
  {
    slug: 'lomas-de-zamora',
    name: 'Lomas de Zamora',
    localities: ['Lomas de Zamora', 'Banfield', 'Temperley', 'Turdera', 'Llavallol'],
    rankingClubs: ['CAB', 'CAT', 'CALZ', 'CDB'],
  },
  {
    slug: 'quilmes',
    name: 'Quilmes',
    localities: ['Quilmes', 'Bernal', 'Ezpeleta'],
    rankingClubs: ['CAQ', 'BER'],
  },
  {
    slug: 'almirante-brown',
    name: 'Almirante Brown',
    localities: ['Almirante Brown', 'Adrogué', 'Claypole', 'Burzaco', 'Longchamps', 'Rafael Calzada', 'José Mármol'],
    rankingClubs: ['AJC', 'CAC', 'JC'],
  },
  {
    slug: 'esteban-echeverria',
    name: 'Esteban Echeverría',
    localities: ['Esteban Echeverría', 'Monte Grande', 'Luis Guillón', 'El Jagüel'],
    rankingClubs: ['CAMG', 'APL'],
  },
]

export const getPartido = (slug: string) => PARTIDOS.find((p) => p.slug === slug) ?? null

const wordPattern = (locality: string) => new RegExp(`(^|[^a-z])${normalizeForSearch(locality)}([^a-z]|$)`)

// The locality part of an address or venue: what follows the first comma or
// dash ("Av. Mitre 470, Avellaneda" → "avellaneda"), else the whole first line.
// Skips street names that equal a locality ("Av. Almirante Brown 123").
function localityText(text: string): string {
  const firstLine = normalizeForSearch(text.split('\n')[0])
  const parts = firstLine.split(/,|\s-\s*|-\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : firstLine
}

/** The known locality named in an address or venue, if any (longest match wins). */
export function findLocality(text: string | null | undefined): { partido: Partido; locality: string } | null {
  if (!text) return null
  const haystack = localityText(text)
  let best: { partido: Partido; locality: string } | null = null
  for (const partido of PARTIDOS) {
    for (const locality of partido.localities) {
      if (wordPattern(locality).test(haystack) && locality.length > (best?.locality.length ?? 0)) best = { partido, locality }
    }
  }
  return best
}

/** True when an address or venue is in the partido. */
export function mentionsPartido(partido: Partido, text: string | null | undefined): boolean {
  return findLocality(text)?.partido === partido
}
