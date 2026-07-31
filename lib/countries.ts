/**
 * ISO 3166-1 alpha-2 country data for the geo-access admin panel.
 * Names come from Intl.DisplayNames and flags from regional indicator
 * symbols, so no country dataset is needed.
 */

export const PROTECTED_COUNTRY = 'AR'

/** A country can only be toggled once every 5 minutes (server-enforced). */
export const COUNTRY_TOGGLE_COOLDOWN_MS = 5 * 60_000

export const CONTINENTS = {
  americaDelSur: {
    label: 'América del Sur',
    codes: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'],
  },
  americaDelNorte: {
    label: 'América del Norte',
    codes: [
      'AG', 'AI', 'AW', 'BB', 'BL', 'BM', 'BQ', 'BS', 'BZ', 'CA', 'CR', 'CU', 'CW', 'DM', 'DO',
      'GD', 'GL', 'GP', 'GT', 'HN', 'HT', 'JM', 'KN', 'KY', 'LC', 'MF', 'MQ', 'MS', 'MX', 'NI',
      'PA', 'PM', 'PR', 'SV', 'SX', 'TC', 'TT', 'US', 'VC', 'VG', 'VI',
    ],
  },
  europa: {
    label: 'Europa',
    codes: [
      'AD', 'AL', 'AT', 'AX', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES',
      'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS', 'IT', 'JE', 'LI',
      'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU',
      'SE', 'SI', 'SJ', 'SK', 'SM', 'UA', 'VA', 'XK',
    ],
  },
  africa: {
    label: 'África',
    codes: [
      'AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EG', 'EH',
      'ER', 'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG',
      'ML', 'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SC', 'SD', 'SH', 'SL', 'SN',
      'SO', 'SS', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'YT', 'ZA', 'ZM', 'ZW',
    ],
  },
  asia: {
    label: 'Asia',
    codes: [
      'AE', 'AF', 'AM', 'AZ', 'BD', 'BH', 'BN', 'BT', 'CN', 'GE', 'HK', 'ID', 'IL', 'IN', 'IO',
      'IQ', 'IR', 'JO', 'JP', 'KG', 'KH', 'KP', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LK', 'MM', 'MN',
      'MO', 'MV', 'MY', 'NP', 'OM', 'PH', 'PK', 'PS', 'QA', 'SA', 'SG', 'SY', 'TH', 'TJ', 'TL',
      'TM', 'TR', 'TW', 'UZ', 'VN', 'YE',
    ],
  },
  oceania: {
    label: 'Oceanía',
    codes: [
      'AS', 'AU', 'CC', 'CK', 'CX', 'FJ', 'FM', 'GU', 'KI', 'MH', 'MP', 'NC', 'NF', 'NR', 'NU',
      'NZ', 'PF', 'PG', 'PN', 'PW', 'SB', 'TK', 'TO', 'TV', 'VU', 'WF', 'WS',
    ],
  },
} as const

export type Continent = keyof typeof CONTINENTS

export const CONTINENT_KEYS = Object.keys(CONTINENTS) as Continent[]

export const ALL_COUNTRY_CODES: string[] = CONTINENT_KEYS.flatMap(
  (key) => CONTINENTS[key].codes as readonly string[]
)

export const CONTINENT_OF: Record<string, Continent> = Object.fromEntries(
  CONTINENT_KEYS.flatMap((key) => CONTINENTS[key].codes.map((code) => [code, key]))
)

const displayNames = new Intl.DisplayNames(['es'], { type: 'region' })
const collator = new Intl.Collator('es', { sensitivity: 'base' })

/** Spanish country name, falling back to the ISO code for unknown regions. */
export function countryName(code: string): string {
  try {
    return displayNames.of(code) ?? code
  } catch {
    return code
  }
}

/** Flag emoji built from regional indicator symbols. */
export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️'
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

export function continentLabel(continent: Continent): string {
  return CONTINENTS[continent].label
}

export function compareCountryNames(a: string, b: string): number {
  return collator.compare(a, b)
}

/** Lowercased and accent-stripped, for accent-insensitive search. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
