"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { NewsFilters } from "@/components/news-filters"
import { NewsPagination } from "@/components/news-pagination"
import { NewsCard } from "@/components/news-card"
import type { NewsDisplay } from "@/lib/newsUtils"
import type { Club } from "@/lib/clubUtils"

const ITEMS_PER_PAGE = 9

// Parses ?page into a strict positive integer, defaulting invalid values to 1.
function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1
  return Number(value)
}

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
// stay statically cached. Filter state lives in the URL (read here, written by
// NewsFilters/NewsPagination), keeping links shareable.
export function NewsList({ allNews, tags, clubs }: NewsListProps) {
  const searchParams = useSearchParams()
  const rawTag = searchParams.get("tag") ?? "all"
  const rawClub = searchParams.get("club") ?? "all"

  const selectedTag = rawTag === "all" || tags.includes(rawTag) ? rawTag : "all"
  const selectedClub =
    rawClub === "all" || rawClub === "fasgba" || clubs.some((c) => c.id.toString() === rawClub)
      ? rawClub
      : "all"
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
  const currentPage = Math.min(parsePage(searchParams.get("page")), totalPages)
  const currentNews = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
            <NewsPagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </>
      )}
    </>
  )
}
