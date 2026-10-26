// Server-side chess-results.com scraping. Pages of tournaments that finished
// more than two weeks ago hide their data behind a "Mostrar detalles del
// torneo" ASP.NET postback, so every page load replays it when present.

import { nameKey } from './match'
import { chessResultsTitle, parseDetails, parseTitle, parseIndividualRound, parsePgnFile, parsePlayers, parseSearchResults, parseTeamList, parseTeamRosters, parseTeamRound } from './parse'
import type { CrPgnGame, CrRound, CrSearchResult, CrTournament } from './types'
import { chessResultsUrl } from './url'

const BASE = 'https://s1.chess-results.com'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; FASGBA-sync/1.0; +https://fasgba.com)' }
const REQUEST_GAP_MS = 250

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function hiddenFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const m of html.matchAll(/<input type="hidden" name="([^"]+)" id="[^"]+" value="([^"]*)"/g)) {
    fields[m[1]] = m[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }
  return fields
}

async function request(url: string, cookie: string, body?: Record<string, string>) {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...HEADERS,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`chess-results respondió ${res.status} para ${url}`)
  const setCookie = res.headers.getSetCookie?.().map((c) => c.split(';')[0]).join('; ')
  return { html: await res.text(), url: res.url, cookie: setCookie || cookie }
}

/** Every field of the page's form with its default value (hidden, text inputs and selects). */
function formFields(html: string): Record<string, string> {
  const fields = hiddenFields(html)
  for (const m of html.matchAll(/<input name="([^"]+)"[^>]*>/g)) {
    if (!m[0].includes('type="submit"')) fields[m[1]] ??= m[0].match(/value="([^"]*)"/)?.[1] ?? ''
  }
  for (const m of html.matchAll(/<select name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    fields[m[1]] ??= (m[2].match(/<option selected="selected" value="([^"]*)"/) ?? m[2].match(/<option value="([^"]*)"/))?.[1] ?? ''
  }
  return fields
}

/** Fetches a page, pressing the "show details" button when chess-results hides the data. */
export async function fetchChessResultsPage(url: string, extraForm: Record<string, string> = {}): Promise<string> {
  const first = await request(url, '')
  const submit = Object.keys(extraForm).length > 0
  if (!submit && !first.html.includes('cb_alleDetails')) return first.html
  await sleep(REQUEST_GAP_MS)
  const form = { ...hiddenFields(first.html), ...extraForm }
  if (first.html.includes('cb_alleDetails') && !submit) form.cb_alleDetails = 'Mostrar detalles del torneo'
  return (await request(first.url, first.cookie, form)).html
}

async function page(tnr: number, params: Record<string, string | number> = {}) {
  const html = await fetchChessResultsPage(chessResultsUrl(tnr, params).replace('https://chess-results.com', BASE))
  await sleep(REQUEST_GAP_MS)
  return html
}

/** The tournament's name as the search list shows it (title and subtitle glued), if found. */
async function listName(tnr: number): Promise<string | null> {
  try {
    return (await searchChessResults({ tnr }))[0]?.name ?? null
  } catch {
    return null
  }
}

/** Clean tournament title (without the subtitle) from its page heading. */
export async function fetchChessResultsTitle(tnr: number, list: string | null): Promise<string | null> {
  const title = parseTitle(await fetchChessResultsPage(`${BASE}/tnr${tnr}.aspx?lan=2`))
  return title ? chessResultsTitle(title, list) : null
}

/** Games of the tournament's "Descargar en formato PGN" download (PartieSuche.aspx). */
export async function fetchChessResultsPgns(tnr: number, searchId: number): Promise<CrPgnGame[]> {
  const first = await request(`${BASE}/PartieSuche.aspx?lan=2&id=${searchId}&tnr=${tnr}&art=3`, '')
  await sleep(REQUEST_GAP_MS)
  const form = { ...formFields(first.html), 'ctl00$P1$cb_DownLoadPGN': 'Descargar en formato PGN' }
  const file = await request(first.url, first.cookie, form)
  return file.html.includes('[Event ') ? parsePgnFile(file.html) : []
}

/** Sets each game's PGN, matched by round and both player names. */
function attachPgns(rounds: CrRound[], pgns: CrPgnGame[]) {
  const byGame = new Map(pgns.map((g) => [`${g.round}|${nameKey(g.white)}|${nameKey(g.black)}`, g.movetext]))
  for (const round of rounds) {
    for (const game of [...round.games, ...round.matches.flatMap((m) => m.games)]) {
      game.pgn = byGame.get(`${round.number}|${nameKey(game.white.name)}|${nameKey(game.black.name)}`) ?? null
    }
  }
}

/** Downloads everything the sync needs: details, players or team rosters, every paired round and the PGNs. */
export async function fetchChessResultsTournament(tnr: number): Promise<CrTournament> {
  const details = parseDetails(await page(tnr, { turdet: 'YES' }), tnr)
  if (!details.name) throw new Error(`No se encontró el torneo ${tnr} en chess-results`)
  details.name = chessResultsTitle(details.name, await listName(tnr))
  const rounds: CrRound[] = []
  const tournament: CrTournament = { details, players: [], teams: [], rounds }
  if (details.isTeam) {
    const list = parseTeamList(await page(tnr, { art: 0, zeilen: 99999 }))
    const rosters = parseTeamRosters(await page(tnr, { art: 1, zeilen: 99999 }))
    tournament.teams = list.length
      ? list.map((team) => ({ ...team, players: rosters.find((r) => r.name === team.name)?.players ?? [] }))
      : rosters
    for (let rd = 1; rd <= details.pairedRounds; rd++) rounds.push(parseTeamRound(await page(tnr, { art: 3, rd }), rd))
  } else {
    tournament.players = parsePlayers(await page(tnr, { art: 0, zeilen: 99999 }))
    for (let rd = 1; rd <= details.pairedRounds; rd++) rounds.push(parseIndividualRound(await page(tnr, { art: 2, rd }), rd))
  }
  if (details.pgnSearchId) attachPgns(rounds, await fetchChessResultsPgns(tnr, details.pgnSearchId))
  return tournament
}

export interface ChessResultsSearch {
  tnr?: number
  organizer?: string
  name?: string
  country?: string // e.g. 'ARG'
  from?: string // YYYY-MM-DD, start date lower bound
}

/** Tournament database search (TurnierSuche.aspx), newest start date first, up to 2000 rows. */
export async function searchChessResults(search: ChessResultsSearch): Promise<CrSearchResult[]> {
  const html = await fetchChessResultsPage(`${BASE}/TurnierSuche.aspx?lan=2`, {
    'ctl00$P1$txt_tnr': search.tnr ? String(search.tnr) : '',
    'ctl00$P1$txt_veranstalter': search.organizer ?? '',
    'ctl00$P1$txt_bez': search.name ?? '',
    'ctl00$P1$combo_land': search.country ?? '-',
    'ctl00$P1$combo_art': '5',
    'ctl00$P1$combo_sort': '3',
    'ctl00$P1$combo_bedenkzeit': '0',
    'ctl00$P1$combo_anzahl_zeilen': '5',
    'ctl00$P1$cb_suchen': 'Buscar',
  })
  // The form's own date filter rejects every format we tried, so filter here.
  return parseSearchResults(html).filter((t) => !search.from || (t.startDate ?? '') >= search.from!)
}
