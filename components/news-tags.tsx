import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { buildNoticiasUrl } from "@/lib/newsDisplay"

const MAX_VISIBLE_TAGS = 3

function TagBadge({ tag }: { tag: string }) {
  return (
    <Link href={buildNoticiasUrl({ tag })}>
      <Badge
        variant="secondary"
        className="text-xs cursor-pointer hover:bg-amber/20 hover:text-amber-dark transition-colors"
      >
        {tag}
      </Badge>
    </Link>
  )
}

export function NewsCardTags({ tags }: { tags: string[] | null }) {
  const visibleTags = tags?.slice(0, MAX_VISIBLE_TAGS) ?? []
  if (visibleTags.length === 0) {
    return null
  }

  const hiddenCount = (tags?.length ?? 0) - visibleTags.length

  return (
    <CardContent className="pt-0 px-4 pb-4">
      <div className="flex flex-wrap gap-1">
        {visibleTags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
        {hiddenCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{hiddenCount}
          </Badge>
        )}
      </div>
    </CardContent>
  )
}
