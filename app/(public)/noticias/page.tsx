import Link from "next/link"
import { redirect } from "next/navigation"
import { unstable_cache } from "next/cache"

import { Button } from "@/components/ui/button"
import { NewsFilters } from "@/components/news-filters"
import { NewsPagination } from "@/components/news-pagination"
import { NewsCard } from "@/components/news-card"
import { buildNoticiasUrl } from "@/lib/newsDisplay"
import { getAllNews, getAllNewsTags, getNewsCount } from "@/lib/newsUtils"
import { getAllClubs } from "@/lib/clubUtils"
import type { NewsDisplay } from "@/lib/newsUtils"
import type { Club } from "@/lib/clubUtils"

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

const ITEMS_PER_PAGE = 9

interface PageProps {
  searchParams: Promise<{
    tag?: string
    club?: string
    page?: string
  }>
}

function resolveClubFilter(club: string) {
  if (club === 'fasgba') return { clubScope: 'federation' as const }

  const id = Number(club)
  if (Number.isInteger(id) && id > 0) {
    return { clubScope: 'club' as const, clubId: id }
  }

  return { clubScope: 'all' as const }
}

function resolveTags(tag: string): string[] | undefined {
  return tag === 'all' ? undefined : [tag]
}

async function getFederationFirstNewsPage(page: number, tag: string) {
  const tags = resolveTags(tag)
  const offset = (page - 1) * ITEMS_PER_PAGE
  const [federationTotal, clubTotal] = await Promise.all([
    getNewsCount({ clubScope: 'federation', tags }),
    getNewsCount({ clubScope: 'clubs', tags }),
  ])

  const data: NewsDisplay[] = []

  if (offset < federationTotal) {
    const federationLimit = Math.min(ITEMS_PER_PAGE, federationTotal - offset)
    const { data: federationNews } = await getAllNews({
      offset,
      limit: federationLimit,
      include: ['club'],
      tags,
      clubScope: 'federation',
    })
    data.push(...federationNews)
  }

  const remaining = ITEMS_PER_PAGE - data.length
  if (remaining > 0) {
    const { data: clubNews } = await getAllNews({
      offset: Math.max(0, offset - federationTotal),
      limit: remaining,
      include: ['club'],
      tags,
      clubScope: 'clubs',
    })
    data.push(...clubNews)
  }

  return {
    data,
    total: federationTotal + clubTotal,
  }
}

// Cached fetchers — results are cached for 5 minutes per filter/page combination
// (unstable_cache keys on the arguments) and invalidated via the 'news' tag.
const getCachedNewsPage = unstable_cache(
  (page: number, tag: string, club: string) => {
    const clubFilter = resolveClubFilter(club)

    if (clubFilter.clubScope === 'all') {
      return getFederationFirstNewsPage(page, tag)
    }

    return getAllNews({
      page,
      limit: ITEMS_PER_PAGE,
      include: ['club'],
      tags: resolveTags(tag),
      ...clubFilter,
    })
  },
  ['noticias-page'],
  { revalidate: 300, tags: ['news'] }
)

const getCachedNewsTotal = unstable_cache(
  () => getNewsCount(),
  ['noticias-total'],
  { revalidate: 300, tags: ['news'] }
)

const getCachedTags = unstable_cache(
  () => getAllNewsTags(),
  ['news-tags'],
  { revalidate: 300, tags: ['news'] }
)

const getCachedClubs = unstable_cache(
  () => getAllClubs(),
  ['clubs-list'],
  { revalidate: 300, tags: ['clubs'] }
)

async function fetchNewsPage(page: number, tag: string, club: string) {
  try {
    return await getCachedNewsPage(page, tag, club)
  } catch (error) {
    console.error('Error fetching news:', error)
    return { data: [] as NewsDisplay[], total: 0 }
  }
}

async function fetchTags(): Promise<string[]> {
  try {
    return await getCachedTags()
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

async function fetchClubs(): Promise<Club[]> {
  try {
    return await getCachedClubs()
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
}

async function fetchTotalCount(): Promise<number> {
  try {
    return await getCachedNewsTotal()
  } catch (error) {
    console.error('Error fetching news count:', error)
    return 0
  }
}

// Parses ?page into a strict positive integer, defaulting invalid values to 1.
function parsePage(value: string | undefined): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1
  return Number(value)
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawTag = params.tag || 'all'
  const rawClub = params.club || 'all'
  const requestedPage = parsePage(params.page)

  const [tags, clubs, totalCount] = await Promise.all([
    fetchTags(),
    fetchClubs(),
    fetchTotalCount(),
  ])

  const selectedTag = rawTag === 'all' || tags.includes(rawTag) ? rawTag : 'all'
  const selectedClub = rawClub === 'all' ||
    rawClub === 'fasgba' ||
    clubs.some((club) => club.id.toString() === rawClub)
    ? rawClub
    : 'all'

  if (selectedTag !== rawTag || selectedClub !== rawClub || (params.page && params.page !== requestedPage.toString())) {
    redirect(buildNoticiasUrl({ tag: selectedTag, club: selectedClub, page: requestedPage }))
  }

  const hasActiveFilters = selectedTag !== 'all' || selectedClub !== 'all'

  const { data: currentNews, total } = await fetchNewsPage(requestedPage, selectedTag, selectedClub)

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  // Redirect out-of-range pages to the canonical last page so URLs stay valid.
  if (requestedPage > totalPages) {
    redirect(buildNoticiasUrl({ tag: selectedTag, club: selectedClub, page: totalPages }))
  }

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">Noticias</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Mantenete al día con las últimas novedades del ajedrez en la región sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta mb-4">
                  {hasActiveFilters ? 'Noticias filtradas' : 'Todas las noticias'}
                </h2>

                <NewsFilters
                  tags={tags}
                  clubs={clubs}
                  selectedTag={selectedTag}
                  selectedClub={selectedClub}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </div>

            <div className="mb-6 text-sm text-muted-foreground">
              Mostrando {currentNews.length} de {total} noticias
              {hasActiveFilters && ` (${totalCount} total)`}
            </div>

            {total === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'No se encontraron noticias con los filtros seleccionados.'
                    : 'No hay noticias disponibles en este momento.'
                  }
                </p>
                {hasActiveFilters && (
                  <Link href="/noticias">
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                    >
                      Limpiar filtros
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentNews.map((item) => (
                    <NewsCard key={item.id} news={item} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <NewsPagination
                    currentPage={requestedPage}
                    totalPages={totalPages}
                  />
                )}
              </>
            )}
          </div>
        </section>
    </>
  )
}
