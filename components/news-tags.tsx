import Link from "next/link"
import { Tag } from "lucide-react"

import { InfoPill } from "@/components/info-pill"
import { buildNoticiasUrl } from "@/lib/newsDisplay"

const MAX_VISIBLE_TAGS = 3

// Tag pills linking to the filtered news list. Rendered inside stretched-link
// cards, so each link sits above the card's overlay (relative z-10).
export function NewsCardTags({ tags }: { tags: string[] | null }) {
  const visibleTags = tags?.slice(0, MAX_VISIBLE_TAGS) ?? []
  if (visibleTags.length === 0) {
    return null
  }

  const hiddenCount = (tags?.length ?? 0) - visibleTags.length

  return (
    <div className="mt-auto flex flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <Link
          key={tag}
          href={buildNoticiasUrl({ tag })}
          className="relative z-10 rounded-full transition-colors hover:[&>span]:border-amber hover:[&>span]:text-foreground"
        >
          <InfoPill icon={Tag}>{tag}</InfoPill>
        </Link>
      ))}
      {hiddenCount > 0 && (
        <span className="self-center text-xs text-muted-foreground">+{hiddenCount}</span>
      )}
    </div>
  )
}
