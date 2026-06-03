const ARGENTINA_LOCALE = 'es-AR'
const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

const DATE_ONLY_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

function formatInArgentina(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIME_ZONE,
    ...options,
  })
}

function getDateParts(date: Date, timeZone = ARGENTINA_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: values.year,
    month: values.month,
    day: values.day,
  }
}

// Reads the calendar date (YYYY-MM-DD) at the start of a stored value and pins
// it to midday UTC, which stays on the same day once converted to Argentina time.
function parseCalendarDate(value: string) {
  const match = DATE_INPUT_PATTERN.exec(value)
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12))
}

export function getArgentinaDateInputValue(date = new Date()) {
  const { year, month, day } = getDateParts(date)
  return `${year}-${month}-${day}`
}

export function getDateInputValue(value: string) {
  const match = DATE_INPUT_PATTERN.exec(value)
  return match?.[0] ?? getArgentinaDateInputValue(new Date(value))
}

/**
 * Formats a stored instant (ISO timestamp string) as its Argentina-local
 * calendar date. Use for values that carry a real time, e.g. `created_at` or a
 * news publication date.
 */
export function formatArgentinaDate(
  isoTimestamp: string,
  options: Intl.DateTimeFormatOptions = DATE_ONLY_OPTIONS
) {
  return formatInArgentina(new Date(isoTimestamp), options)
}

/**
 * Formats a stored publication date (a DATE column, serialized as YYYY-MM-DD) as
 * a calendar date. News dates are chosen by editors as whole days, so UTC offsets
 * must not move them to another day.
 */
export function formatArgentinaDateOnly(
  dateString: string,
  options: Intl.DateTimeFormatOptions = DATE_ONLY_OPTIONS
) {
  return formatInArgentina(parseCalendarDate(dateString) ?? new Date(dateString), options)
}

/**
 * Formats a timezone-agnostic calendar `Date` (e.g. a tournament day parsed as
 * local midnight) without letting the Argentina offset shift it to the previous
 * day. The day/month/year are read as wall-clock components and pinned to midday
 * UTC, which stays on the same calendar day once converted to Argentina time.
 */
export function formatArgentinaCalendarDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = DATE_ONLY_OPTIONS
) {
  const pinned = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12))
  return formatInArgentina(pinned, options)
}
