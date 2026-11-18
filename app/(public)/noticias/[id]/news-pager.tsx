import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { AdjacentNews } from "@/lib/newsUtils"
import { cn } from "@/lib/utils"

function PagerLink({ news, direction }: { news: AdjacentNews; direction: "older" | "newer" }) {
  const older = direction === "older"
  const Icon = older ? ChevronLeft : ChevronRight
  return (
    <Link
      href={`/noticias/${news.id}`}
      rel={older ? "prev" : "next"}
      className={cn(
        "flex h-full items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-amber",
        !older && "flex-row-reverse text-right sm:col-start-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-muted-foreground">
          {older ? "Noticia anterior" : "Noticia siguiente"}
        </span>
        <span className="line-clamp-2 font-semibold leading-tight text-terracotta">{news.title}</span>
      </span>
    </Link>
  )
}

// Links each article to its chronological neighbours so every article is reachable.
export function NewsPager({ older, newer }: { older: AdjacentNews | null; newer: AdjacentNews | null }) {
  if (!older && !newer) return null
  return (
    <nav aria-label="Más noticias" className="mt-10 grid gap-3 sm:grid-cols-2">
      {older && <PagerLink news={older} direction="older" />}
      {newer && <PagerLink news={newer} direction="newer" />}
    </nav>
  )
}
