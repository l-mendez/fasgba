import type { Metadata } from 'next'

import { PARTIDOS } from '@/lib/partidos'

// Shared SEO constants and schema.org builders. Canonical URLs always point at
// production, so previews and local builds never advertise themselves.
export const SITE_URL = 'https://fasgba.com'
export const SITE_NAME = 'FASGBA'
export const FEDERATION_FULL_NAME = 'Federación de Ajedrez del Sur del Gran Buenos Aires'
export const SITE_DESCRIPTION =
  'Federación de Ajedrez del Sur del Gran Buenos Aires: torneos, ranking oficial, clubes, clases y árbitros de ajedrez en la zona sur del conurbano.'
export const DEFAULT_OG_IMAGE = '/opengraph-image'
export const LOGO_URL = `${SITE_URL}/favicon.png`

export const SOCIAL_PROFILES = [
  'https://facebook.com/FASGBA',
  'https://www.instagram.com/fasgba_ok',
  'https://www.wikidata.org/wiki/Q142133029',
]

// Partidos with affiliated clubs (see lib/partidos.ts).
export const MUNICIPALITIES = PARTIDOS.map(({ name }) => name)

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

export type JsonLdObject = { [key: string]: unknown }

export const organizationJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  '@id': ORGANIZATION_ID,
  name: FEDERATION_FULL_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
  sport: 'Ajedrez',
  foundingDate: '1975',
  description: SITE_DESCRIPTION,
  email: 'secretaria@fasgba.com',
  telephone: '+54 9 11 4028 2610',
  areaServed: MUNICIPALITIES.map((name) => ({ '@type': 'City', name: `${name}, Buenos Aires, Argentina` })),
  address: { '@type': 'PostalAddress', addressRegion: 'Buenos Aires', addressCountry: 'AR' },
  sameAs: SOCIAL_PROFILES,
}

// Inline reference for publisher/organizer fields on pages without the full node.
export const organizationRef: JsonLdObject = {
  '@type': 'SportsOrganization',
  '@id': ORGANIZATION_ID,
  name: FEDERATION_FULL_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
}

export const websiteJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  alternateName: FEDERATION_FULL_NAME,
  url: SITE_URL,
  inLanguage: 'es-AR',
  publisher: { '@id': ORGANIZATION_ID },
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

// Search engines show ~155-160 characters; longer descriptions are cut at a
// word boundary so snippets never end mid-word.
const MAX_DESCRIPTION = 155

export function metaDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= MAX_DESCRIPTION) return clean
  const cut = clean.slice(0, MAX_DESCRIPTION)
  const atWord = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.\-–—]+$/, '')
  return `${atWord || cut.slice(0, MAX_DESCRIPTION - 1)}…`
}

// Descriptions under ~70 characters ("Sistema Suizo") make search engines
// invent their own snippet; extend them with page context.
const MIN_DESCRIPTION = 70

export function withContext(text: string | null | undefined, context: string): string {
  const clean = text?.replace(/\s+/g, ' ').trim() ?? ''
  if (clean.length >= MIN_DESCRIPTION) return clean
  if (!clean) return context
  return `${clean}${/[.!?…]$/.test(clean) ? '' : '.'} ${context}`
}

// Metadata for an indexable page: canonical URL plus matching Open Graph tags.
// Without `image`, the default app/opengraph-image card is used.
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  image?: string | null
  type?: 'website' | 'article'
}): Metadata {
  description = metaDescription(description)
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'es_AR',
      type,
      images: [{ url: image ?? DEFAULT_OG_IMAGE }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image ?? DEFAULT_OG_IMAGE] },
  }
}
