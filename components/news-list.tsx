"use client"

import { useEffect, useMemo, useState } from "react"

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

  // Seed filters from the URL once on mount so deep links from news-card tag
  // badges (/noticias?tag=foo) still land on a filtered view. State is local
  // afterwards, keeping the page statically prerenderable (no useSearchParams).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tag = params.get("tag")
    const club = params.get("club")
    if (tag && (tag === "all" || tags.includes(tag))) setSelectedTag(tag)
    if (
      club &&
      (club === "all" || club === "fasgba" || clubs.some((c) => c.id.toString() === club))
    ) {
      setSelectedClub(club)
    }
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
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-terracotta mb-4">
            {hasActiveFilters ? "Noticias filtradas" : "Todas las noticias"}
          </h2>

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
      </div>

      <div className="mb-6 text-sm text-muted-foreground">
        Mostrando {currentNews.length} de {total} noticias
        {hasActiveFilters && ` (${allNews.length} total)`}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <NewsPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </>
  )
}
