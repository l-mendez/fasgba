// Client-safe helpers to go between chess-results links and tournament ids.

const TNR_IN_URL = /tnr(\d{1,8})\.aspx/i

/** Extracts the chess-results tournament id from a link or a bare number. */
export function parseChessResultsTnr(input: string | number | null | undefined): number | null {
  if (input == null) return null
  const value = String(input).trim()
  const match = /^\d{1,8}$/.test(value) ? value : value.match(TNR_IN_URL)?.[1]
  const tnr = match ? Number(match) : NaN
  return Number.isInteger(tnr) && tnr > 0 ? tnr : null
}

/** Public chess-results link for a tournament (Spanish UI). */
export function chessResultsUrl(tnr: number, params: Record<string, string | number> = {}): string {
  const query = new URLSearchParams({ lan: '2' })
  for (const [key, value] of Object.entries(params)) query.set(key, String(value))
  return `https://chess-results.com/tnr${tnr}.aspx?${query}`
}
