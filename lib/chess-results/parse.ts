import { cellText, labelValues, tableRows, toIsoDate, toNumber, type CrRow } from './html'
import type {
  CrDetails, CrGame, CrPlayer, CrPlayerRef, CrResult, CrRound, CrSearchResult, CrTeam, CrTeamMatch,
} from './types'

const BYE_NAMES = /^(sin emparejar|bye|libre|not paired|spielfrei)$/i

function findLabel(values: Map<string, string>, test: (label: string) => boolean): string | null {
  for (const [label, value] of values) if (test(label)) return value || null
  return null
}

const isHeader = (row: CrRow) => /^CR\w*b$/.test(row.cls.split(' ')[0])

function headerIndex(header: string[], ...names: string[]): number {
  return header.findIndex((cell) => names.includes(cell))
}

/** Normalises a chess-results score ("1 - 0", "½ - ½", "+ - -") from the left player's view. */
export function parseScore(text: string): { result: CrResult; forfeit: boolean } | null {
  const score = text.replace(/\s+/g, '').replace(/½/g, '1/2')
  switch (score) {
    case '1-0': return { result: '1-0', forfeit: false }
    case '0-1': return { result: '0-1', forfeit: false }
    case '1/2-1/2': return { result: '1/2-1/2', forfeit: false }
    case '+--': return { result: '1-0', forfeit: true }
    case '--+': return { result: '0-1', forfeit: true }
    case '': case '-': return { result: '*', forfeit: false }
    default: return null // double forfeits, 0-0 and other non-games
  }
}

function swap(result: CrResult): CrResult {
  return result === '1-0' ? '0-1' : result === '0-1' ? '1-0' : result
}

export function parseTitle(html: string): string {
  const match = html.match(/<h2>([\s\S]*?)<\/h2>/)
  return match ? cellText(match[1]) : ''
}

export function parseDetails(html: string, tnr: number): CrDetails {
  const values = labelValues(html)
  const system = findLabel(values, (l) => l === 'Tipo de torneo')
  const dates = findLabel(values, (l) => l === 'Fecha') ?? ''
  const [startDate, endDate] = dates.split(/\s+al\s+/).map(toIsoDate)
  const pairings = findLabel(values, (l) => l === 'Emparejamientos por mesas') ?? ''
  const pairedRounds = new Set(pairings.match(/Rd\.\d+/g) ?? []).size
  return {
    tnr,
    name: parseTitle(html),
    organizer: findLabel(values, (l) => l.endsWith('Organizador')),
    director: findLabel(values, (l) => l === 'Director del Torneo'),
    chiefArbiter: findLabel(values, (l) => l === 'Árbitro principal'),
    timeControl: findLabel(values, (l) => l.startsWith('Control de tiempo') || l.startsWith('Ritmo')),
    place: findLabel(values, (l) => l === 'Lugar'),
    rounds: toNumber(findLabel(values, (l) => l === 'Número de rondas')),
    pairedRounds,
    system,
    startDate: startDate ?? null,
    endDate: endDate ?? startDate ?? null,
    isTeam: /equipo/i.test(system ?? ''),
    lastUpdate: html.match(/Última actualización\s*([\d.]+ [\d:]+)/)?.[1] ?? null,
  }
}

function playersFromRows(rows: CrRow[], start: number): CrPlayer[] {
  const header = rows[start].cells
  const name = headerIndex(header, 'Nombre', 'Name')
  const no = headerIndex(header, 'No.', 'M.', 'Nr.')
  const fide = headerIndex(header, 'FIDE-ID', 'ID FIDE')
  const fed = headerIndex(header, 'FED')
  const elo = header.findIndex((c) => /^(Elo|Rtg)/.test(c))
  const club = headerIndex(header, 'Club/Ciudad', 'Club/City')
  const players: CrPlayer[] = []
  for (const row of rows.slice(start + 1)) {
    if (isHeader(row) || !row.cells[name]) break
    players.push({
      startNo: toNumber(row.cells[no]),
      name: row.cells[name],
      title: row.cells[name - 1] || null,
      fideId: fide >= 0 && row.cells[fide] && row.cells[fide] !== '0' ? row.cells[fide] : null,
      rating: toNumber(row.cells[elo]) || null,
      federation: row.cells[fed] || null,
      club: club >= 0 ? row.cells[club] || null : null,
    })
  }
  return players
}

/** Individual starting rank list (art=0). */
export function parsePlayers(html: string): CrPlayer[] {
  const rows = tableRows(html)
  const start = rows.findIndex((r) => isHeader(r) && r.cells.includes('Nombre'))
  return start < 0 ? [] : playersFromRows(rows, start)
}

/** Team list (art=0) — ranking or starting rank, whichever is published. */
export function parseTeamList(html: string): Array<{ startNo: number | null; name: string }> {
  const rows = tableRows(html)
  const start = rows.findIndex((r) => isHeader(r) && r.cells.includes('Equipo'))
  if (start < 0) return []
  const header = rows[start].cells
  const name = header.indexOf('Equipo')
  const no = headerIndex(header, 'No.Ini.', 'No.', 'Snr')
  return rows.slice(start + 1).filter((r) => !isHeader(r) && r.cells[name])
    .map((r) => ({ startNo: toNumber(r.cells[no]), name: r.cells[name] }))
}

/** Team compositions (art=1): "N. Team (Elo medio…)" headers followed by player rows. */
export function parseTeamRosters(html: string): CrTeam[] {
  const rows = tableRows(html)
  const teams: CrTeam[] = []
  rows.forEach((row, i) => {
    const title = row.cells.length === 1 ? row.cells[0].match(/^\d+\.\s*(.+?)(?:\s*\(.*\))?$/) : null
    if (!title || !rows[i + 1]?.cells.includes('Nombre')) return
    teams.push({ startNo: null, name: title[1].trim(), players: playersFromRows(rows, i + 1) })
  })
  return teams
}

function roundDate(html: string): string | null {
  return toIsoDate(html.match(/Ronda el (\d{4}\/\d{2}\/\d{2})/)?.[1])
}

function ref(name: string, startNo: string | number | null | undefined, rating: string | undefined): CrPlayerRef {
  return { name, startNo: toNumber(startNo == null ? null : String(startNo)), rating: toNumber(rating) || null }
}

/** Individual pairings for one round (art=2&rd=N). Byes and double forfeits are skipped. */
export function parseIndividualRound(html: string, number: number): CrRound {
  const rows = tableRows(html)
  const start = rows.findIndex((r) => r.cells.includes('Resultado'))
  const games: CrGame[] = []
  if (start >= 0) {
    const header = rows[start].cells
    const result = header.indexOf('Resultado')
    const white = header.findIndex((c, i) => i < result && /^(White|Blancas|Nombre)$/.test(c))
    const black = header.findIndex((c, i) => i > result && /^(Black|Negras|Nombre)$/.test(c))
    const blackNo = header.lastIndexOf('No.')
    for (const row of rows.slice(start + 1)) {
      const c = row.cells
      const score = parseScore(c[result] ?? '')
      if (!score || !c[white] || !c[black] || BYE_NAMES.test(c[black]) || BYE_NAMES.test(c[white])) continue
      games.push({
        board: toNumber(c[0]) ?? games.length + 1,
        white: ref(c[white], c[1], c[white + 1]),
        black: ref(c[black], blackNo > result ? c[blackNo] : null, c[black + 1]),
        ...score,
      })
    }
  }
  return { number, date: roundDate(html), games, matches: [] }
}

/** Board pairings for one team round (art=3&rd=N). Left player always belongs to the home team. */
export function parseTeamRound(html: string, number: number): CrRound {
  const matches: CrTeamMatch[] = []
  for (const row of tableRows(html)) {
    const c = row.cells
    if (c[0] === 'M.' && c.length >= 7) {
      matches.push({
        table: matches.length + 1,
        home: { startNo: toNumber(c[1]), name: c[2] },
        away: { startNo: toNumber(c[5]), name: c[6] },
        games: [],
      })
      continue
    }
    const board = c[0]?.match(/^\d+\.(\d+)$/)
    const match = matches[matches.length - 1]
    const [left, right] = row.colors.flatMap((color, i) => (color ? [i] : []))
    if (!board || !match || left === undefined || right === undefined) continue
    const score = c.slice(right + 1).map(parseScore).find((s) => s && s.result !== '*') ?? parseScore('')
    if (!score || !c[left] || !c[right]) continue
    const home = ref(c[left], row.snrs[left], c[left + 1])
    const away = ref(c[right], row.snrs[right], c[right + 1])
    const homeIsWhite = row.colors[left] === 'w'
    match.games.push({
      board: Number(board[1]),
      white: homeIsWhite ? home : away,
      black: homeIsWhite ? away : home,
      result: homeIsWhite ? score.result : swap(score.result),
      forfeit: score.forfeit,
    })
  }
  return { number, date: roundDate(html), games: [], matches }
}

/** Rows of the TurnierSuche.aspx search results table. */
export function parseSearchResults(html: string): CrSearchResult[] {
  const results: CrSearchResult[] = []
  for (const row of tableRows(html)) {
    const c = row.cells
    const tnr = toNumber(c[18])
    if (!/^CRg[12]/.test(row.cls) || c.length < 19 || !tnr) continue
    results.push({
      tnr,
      name: c[1],
      startDate: toIsoDate(c[5]),
      endDate: toIsoDate(c[6]),
      organizer: [c[7], c[8]].filter(Boolean).join(' · ') || null,
      place: c[12] || null,
      timeControl: c[13] || null,
      rounds: toNumber(c[16]),
      players: toNumber(c[17]),
    })
  }
  return results
}
