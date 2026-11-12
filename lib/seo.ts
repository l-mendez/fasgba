import type { Metadata } from 'next'

// Shared SEO constants and schema.org builders. Canonical URLs always point at
// production, so previews and local builds never advertise themselves.
export const SITE_URL = 'https://fasgba.com'
export const SITE_NAME = 'FASGBA'
export const FEDERATION_FULL_NAME = 'Federación de Ajedrez del Sur del Gran Buenos Aires'
export const SITE_DESCRIPTION =
  'FASGBA, la Federación de Ajedrez del Sur del Gran Buenos Aires: torneos, ranking oficial de jugadores, clubes afiliados, profesores y árbitros de ajedrez de la zona sur del conurbano bonaerense.'
export const DEFAULT_OG_IMAGE = '/opengraph-image'
export const LOGO_URL = `${SITE_URL}/favicon.png`

export const SOCIAL_PROFILES = [
  'https://facebook.com/FASGBA',
  'https://www.instagram.com/fasgba_ok',
]

// Partidos with affiliated clubs (from club addresses).
export const MUNICIPALITIES = [
  'Avellaneda',
  'Lanús',
  'Lomas de Zamora',
  'Quilmes',
  'Almirante Brown',
  'Esteban Echeverría',
  'Ezeiza',
  'Cañuelas',
  'San Vicente',
]

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
