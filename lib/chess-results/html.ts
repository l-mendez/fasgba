// Minimal table scraping for chess-results pages. Their markup is stable,
// server-rendered ASP.NET tables, so regexes are enough (no DOM dependency).

export interface CrRow {
  cls: string
  cells: string[]
  colors: Array<'w' | 'b' | null>
  snrs: Array<number | null>
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', frac12: '½',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
}

export function decodeHtml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z][a-z0-9]*);/gi, (match, name) => ENTITIES[name] ?? match)
}

export function cellText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

// Player cells in team pairings nest a table with a colour marker div.
const COLOR_CELL = /<table><tr><td><div class="Farbe([ws])T"><\/div><\/td><td class="CR">([\s\S]*?)<\/td><\/tr><\/table>/g

export function tableRows(html: string): CrRow[] {
  const flat = html.replace(COLOR_CELL, (_, color, inner) => `[[${color}]]${inner}`)
  const rows: CrRow[] = []
  for (const row of flat.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)) {
    const raw = [...row[2].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((cell) => cell[1])
    if (raw.length === 0) continue
    rows.push({
      cls: row[1].match(/class="([^"]*)"/)?.[1] ?? '',
      cells: raw.map((cell) => cellText(cell.replace(/\[\[[ws]\]\]/, ''))),
      colors: raw.map((cell) => (cell.includes('[[w]]') ? 'w' : cell.includes('[[s]]') ? 'b' : null)),
      snrs: raw.map((cell) => {
        const snr = cell.match(/[?&](?:amp;)?snr=(\d+)/)?.[1]
        return snr ? Number(snr) : null
      }),
    })
  }
  return rows
}

/** Two-column label/value rows (tournament details block). */
export function labelValues(html: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of tableRows(html)) {
    if (row.cells.length === 2 && row.cells[0] && !map.has(row.cells[0])) map.set(row.cells[0], row.cells[1])
  }
  return map
}

export function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** chess-results dates are YYYY/MM/DD. */
export function toIsoDate(value: string | null | undefined): string | null {
  const match = value?.match(/(\d{4})\/(\d{2})\/(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}
