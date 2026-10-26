"use client"

import { useEffect, useMemo, useRef, useState } from "react"

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

interface NewsListProps {
  allNews: NewsDisplay[]
  tags: string[]
  clubs: Club[]
}

// Client island: filters/paginates the full news catalog so the page itself can
// stay statically prerendered. Filter state is local (useState), so the default
// unfiltered view renders into the static HTML — good for SEO and first paint.
export function NewsList({ allNews, tags, clubs }: NewsListProps) {
  const [selectedTag, setSelectedTag] = useState("all")
  const [selectedClub, setSelectedClub] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  // True once the state has been seeded from the URL; until then the URL is
  // left untouched so a deep link isn't overwritten by the defaults.
  const [urlSeeded, setUrlSeeded] = useState(false)
  const listTopRef = useRef<HTMLDivElement>(null)

  // Seed filters/page from the URL on mount so deep links (/noticias?tag=foo,
  // tag badges on cards, Back from an article) land on the same view. Reading
  // window.location keeps the page statically prerenderable (no useSearchParams).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tag = params.get("tag")
    const club = params.get("club")
    const pageParam = Number(params.get("page"))
    if (tag && (tag === "all" || tags.includes(tag))) setSelectedTag(tag)
    if (
      club &&
      (club === "all" || club === "fasgba" || clubs.some((c) => c.id.toString() === club))
    ) {
      setSelectedClub(club)
    }
    if (Number.isInteger(pageParam) && pageParam > 1) setCurrentPage(pageParam)
    setUrlSeeded(true)
  }, [tags, clubs])

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
    if (!urlSeeded) return
    const params = new URLSearchParams()
    if (selectedTag !== "all") params.set("tag", selectedTag)
    if (selectedClub !== "all") params.set("club", selectedClub)
    if (page > 1) params.set("page", String(page))
    const query = params.toString()
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url)
    }
  }, [urlSeeded, selectedTag, selectedClub, page])

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage)
    // Bring the top of the list back into view (e.g. after using the bottom pagination).
    const listTop = listTopRef.current
    if (listTop && listTop.getBoundingClientRect().top < 80) {
      listTop.scrollIntoView({ block: "start" })
    }
  }

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrentPage(1)
  }
  const handleClubChange = (club: string) => {
    setSelectedClub(club)
    setCurrentPage(1)
  }
  const handleClear = () => {
    setSelectedTag("all")
    setSelectedClub("all")
    setCurrentPage(1)
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
