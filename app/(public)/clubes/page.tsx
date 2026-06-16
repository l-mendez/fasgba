import { Suspense } from "react"
import { Metadata } from "next"
import { unstable_cache } from "next/cache"

import { getAllClubs, type Club } from "@/lib/clubUtils"
import { ClubSearch } from "@/components/club-search"
import { ClubsGrid } from "@/components/clubs-grid"

// The directory is identical for everyone, so cache it and refresh every 5
// minutes (or via the 'clubs' tag). Per-user follow state and search are
// resolved on the client, keeping this page statically cacheable.
export const revalidate = 300

const getCachedClubs = unstable_cache(
  (): Promise<Club[]> => getAllClubs(),
  ['clubes-directory'],
  { revalidate: 300, tags: ['clubs'] }
)

// Generate metadata for better link previews
export const metadata: Metadata = {
  title: 'Clubes Afiliados - FASGBA',
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
  const clubs = await getCachedClubs()

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Directorio de Clubes</h2>
                <p className="text-muted-foreground">
                  Encuentra información detallada sobre cada club afiliado a FASGBA
                </p>
              </div>
              <Suspense fallback={<div className="w-full md:w-1/3 h-10 bg-muted animate-pulse rounded" />}>
                <ClubSearch />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<div className="min-h-[400px]" />}>
            <ClubsGrid clubs={clubs} />
          </Suspense>
        </div>
      </section>
    </>
  )
}

