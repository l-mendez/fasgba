import { Suspense } from "react"
import { Metadata } from "next"
import { unstable_cache } from "next/cache"

import { getAllClubs, type Club } from "@/lib/clubUtils"
import { ClubSearch } from "@/components/club-search"
import { ClubCards, ClubsGrid } from "@/components/clubs-grid"
import { PageHero } from "@/components/page-hero"
import { safe } from "@/lib/utils/safe"
import { pageMetadata } from '@/lib/seo'

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
export const metadata: Metadata = pageMetadata({
  title: 'Clubes de ajedrez en zona sur: dónde jugar',
  description:
    'Dónde jugar al ajedrez en la zona sur: clubes afiliados a FASGBA en Avellaneda, Lanús, Lomas de Zamora, Quilmes, Almirante Brown, Esteban Echeverría y más, con dirección, horarios y contacto.',
  path: '/clubes',
})

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

          <Suspense fallback={<ClubCards clubs={clubs} />}>
            <ClubsGrid clubs={clubs} />
          </Suspense>
        </div>
      </section>
    </>
  )
}

