import Image from "next/image"
import Link from "next/link"

import { NewsCardTags } from "@/components/news-tags"
import { Card, CardContent } from "@/components/ui/card"
import { getImageUrlNullable } from "@/lib/imageUtils"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { FEDERATION_NAME } from "@/lib/newsDisplay"
import type { NewsDisplay } from "@/lib/newsUtils"

function NewsCardImage({ image, title }: { image: string | null; title: string }) {
  const imageUrl = image ? getImageUrlNullable(image) : null

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Sin imagen</p>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={title}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover"
    />
  )
}

export function NewsCard({ news }: { news: NewsDisplay }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
      <Link href={`/noticias/${news.id}`}>
        <div className="cursor-pointer hover:scale-[1.02] transition-transform">
          <div className="aspect-video relative bg-muted">
            <NewsCardImage image={news.image} title={news.title} />
          </div>

          <CardContent className="p-4">
            <div className="mb-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <span className="shrink-0">{formatArgentinaDateOnly(news.date)}</span>
              <span className="min-w-0 truncate font-medium" title={news.club?.name || FEDERATION_NAME}>
                {news.club?.name || FEDERATION_NAME}
              </span>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{news.title}</h3>

            {news.extract && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{news.extract}</p>
            )}
          </CardContent>
        </div>
      </Link>

      <NewsCardTags tags={news.tags} />
    </Card>
  )
}
