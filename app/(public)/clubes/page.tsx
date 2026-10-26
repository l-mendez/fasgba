import { Suspense } from "react"
import { Metadata } from "next"
import { unstable_cache } from "next/cache"

import { getAllClubs, type Club } from "@/lib/clubUtils"
import { ClubSearch } from "@/components/club-search"
import { ClubsGrid } from "@/components/clubs-grid"
import { PageHero } from "@/components/page-hero"
import { safe } from "@/lib/utils/safe"

// The directory is identical for everyone, so cache it indefinitely and refresh
// only via revalidateClubsCache. Per-user follow state and search are resolved
// on the client, keeping this page statically cacheable.
export const revalidate = false

const getCachedClubs = unstable_cache(
  (): Promise<Club[]> => getAllClubs(),
  ['clubes-directory'],
  { revalidate: false, tags: ['clubs'] }
)

// Generate metadata for better link previews
export const metadata: Metadata = {
  title: 'Clubes',
  description: 'Directorio completo de clubes afiliados a la Federación de Ajedrez del Sur del Gran Buenos Aires. Encuentra información de contacto, horarios y actividades.',
  keywords: ['FASGBA', 'clubes', 'ajedrez', 'afiliados', 'federación', 'Buenos Aires', 'directorio'],
  openGraph: {
    title: 'Clubes Afiliados - FASGBA',
    description: 'Directorio completo de clubes afiliados a la Federación de Ajedrez del Sur del Gran Buenos Aires. Encuentra información de contacto, horarios y actividades.',
    url: 'https://fasgba.com/clubes',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Clubes FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clubes Afiliados - FASGBA',
    description: 'Directorio completo de clubes afiliados a la Federación de Ajedrez del Sur del Gran Buenos Aires.',
    images: ['https://fasgba.com/images/fasgba-logo.png'],
    creator: '@FASGBA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function ClubesPage() {
  const clubs = await safe(getCachedClubs, [] as Club[], "Error fetching clubs:")

  return (
    <>
      <PageHero title="Clubes" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <div className="mb-8">
            <Suspense fallback={<div className="w-full md:w-1/3 h-10 bg-muted animate-pulse rounded" />}>
              <ClubSearch />
            </Suspense>
          </div>

          <Suspense fallback={<div className="min-h-[400px]" />}>
            <ClubsGrid clubs={clubs} />
          </Suspense>
        </div>
      </section>
    </>
  )
}

