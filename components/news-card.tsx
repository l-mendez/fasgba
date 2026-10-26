import Image from "next/image"
import Link from "next/link"
import { Building2, Calendar, ImageIcon } from "lucide-react"

import { NewsCardTags } from "@/components/news-tags"
import { getImageUrlNullable } from "@/lib/imageUtils"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { FEDERATION_NAME } from "@/lib/newsDisplay"
import type { NewsDisplay } from "@/lib/newsUtils"

function NewsCardImage({ image, title }: { image: string | null; title: string }) {
  const imageUrl = image ? getImageUrlNullable(image) : null

  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      unoptimized
      className="object-cover"
    />
  )
}

// Whole card links to the article (stretched link); tag links sit above it.
export function NewsCard({ news }: { news: NewsDisplay }) {
  const source = news.club?.name || FEDERATION_NAME

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-amber">
      <div className="relative aspect-[4/3] bg-muted">
        <NewsCardImage image={news.image} title={news.title} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-semibold leading-tight line-clamp-2">
          <Link href={`/noticias/${news.id}`} className="text-terracotta after:absolute after:inset-0">
            {news.title}
          </Link>
        </h3>

        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{formatArgentinaDateOnly(news.date)}</span>
          </li>
          <li className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate" title={source}>{source}</span>
          </li>
        </ul>

        {news.extract && <p className="text-sm text-muted-foreground line-clamp-3">{news.extract}</p>}

        <NewsCardTags tags={news.tags} />
      </div>
    </article>
  )
}
