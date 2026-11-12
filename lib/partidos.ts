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

/** True when free text (an address, a venue) names one of the partido's localities. */
export function mentionsPartido(partido: Partido, text: string | null | undefined): boolean {
  if (!text) return false
  const haystack = normalizeForSearch(text)
  return partido.localities.some((locality) => haystack.includes(normalizeForSearch(locality)))
}
