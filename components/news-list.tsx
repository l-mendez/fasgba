"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { NewsFilters } from "@/components/news-filters"
import { NewsPagination } from "@/components/news-pagination"
import { NewsCard } from "@/components/news-card"
import type { NewsDisplay } from "@/lib/newsUtils"
import type { Club } from "@/lib/clubUtils"

const ITEMS_PER_PAGE = 9

function matchesClub(news: NewsDisplay, club: string): boolean {
  if (club === "all") return true
  if (club === "fasgba") return news.club_id === null
  const id = Number(club)
  return Number.isInteger(id) && news.club_id === id
}

// Federation news first, then club news; each side keeps its incoming date-desc
// order. This mirrors the previous server-side federation-first pagination.
function federationFirst(news: NewsDisplay[]): NewsDisplay[] {
  return [
    ...news.filter((n) => n.club_id === null),
    ...news.filter((n) => n.club_id !== null),
  ]
}

type View = { tag: string; club: string; page: number }

const DEFAULT_VIEW: View = { tag: "all", club: "all", page: 1 }

// Valid filters/page from a query string; unknown values fall back to defaults.
function viewFromSearch(search: string, tags: string[], clubs: Club[]): View {
  const params = new URLSearchParams(search)
  const tag = params.get("tag")
  const club = params.get("club")
  const pageParam = Number(params.get("page"))
  return {
    tag: tag && (tag === "all" || tags.includes(tag)) ? tag : "all",
    club:
      club && (club === "all" || club === "fasgba" || clubs.some((c) => c.id.toString() === club))
        ? club
        : "all",
    page: Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1,
  }
}

const subscribeNoop = () => () => {}
const getLocationSearch = () => window.location.search
const getServerSearch = () => null

interface NewsListProps {
  allNews: NewsDisplay[]
  tags: string[]
  clubs: Club[]
}

// Client island: filters/paginates the full news catalog so the page itself can
// stay statically prerendered. Filter state is local (useState), so the default
// unfiltered view renders into the static HTML — good for SEO and first paint.
export function NewsList({ allNews, tags, clubs }: NewsListProps) {
  // Seed filters/page from the URL so deep links (/noticias?tag=foo, tag badges
  // on cards, Back from an article) land on the same view. Reading
  // window.location keeps the page statically prerenderable (no useSearchParams).
  // null on the server and during hydration, so the static default view
  // hydrates cleanly and the URL is left untouched until it has been read.
  const urlSearch = useSyncExternalStore(subscribeNoop, getLocationSearch, getServerSearch)
  const urlView = useMemo(
    () => (urlSearch === null ? DEFAULT_VIEW : viewFromSearch(urlSearch, tags, clubs)),
    [urlSearch, tags, clubs]
  )
  // Set once the user changes a filter or page; until then the URL drives the view.
  const [userView, setUserView] = useState<View | null>(null)
  const { tag: selectedTag, club: selectedClub, page: currentPage } = userView ?? urlView
  const listTopRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters = selectedTag !== "all" || selectedClub !== "all"

  const filtered = useMemo(() => {
    const matches = allNews.filter(
      (n) =>
        (selectedTag === "all" || (n.tags?.includes(selectedTag) ?? false)) &&
        matchesClub(n, selectedClub)
    )
    // Federation-first ordering only applies across the whole catalog.
    return selectedClub === "all" ? federationFirst(matches) : matches
  }, [allNews, selectedTag, selectedClub])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
  const page = Math.min(currentPage, totalPages)
  const currentNews = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Mirror the view into the URL (shareable, kept on Back) without a navigation.
  useEffect(() => {
    if (urlSearch === null) return
    const params = new URLSearchParams()
    if (selectedTag !== "all") params.set("tag", selectedTag)
    if (selectedClub !== "all") params.set("club", selectedClub)
    if (page > 1) params.set("page", String(page))
    const query = params.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url)
    }
  }, [urlSearch, selectedTag, selectedClub, page])

  const handlePageChange = (nextPage: number) => {
    setUserView({ tag: selectedTag, club: selectedClub, page: nextPage })
    // Bring the top of the list back into view (e.g. after using the bottom pagination).
    const listTop = listTopRef.current
    if (listTop && listTop.getBoundingClientRect().top < 80) {
      listTop.scrollIntoView({ block: "start" })
    }
  }

  const handleTagChange = (tag: string) => {
    setUserView({ tag, club: selectedClub, page: 1 })
  }
  const handleClubChange = (club: string) => {
    setUserView({ tag: selectedTag, club, page: 1 })
  }
  const handleClear = () => {
    setUserView(DEFAULT_VIEW)
  }

  return (
    <>
      <div className="mb-8">
        <NewsFilters
          tags={tags}
          clubs={clubs}
          selectedTag={selectedTag}
          selectedClub={selectedClub}
          hasActiveFilters={hasActiveFilters}
          onTagChange={handleTagChange}
          onClubChange={handleClubChange}
          onClear={handleClear}
        />
      </div>

      {total === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "No se encontraron noticias con los filtros seleccionados."
              : "No hay noticias disponibles en este momento."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="brandOutline"
              onClick={handleClear}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div ref={listTopRef} className="grid scroll-mt-20 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <NewsPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </>
  )
}
