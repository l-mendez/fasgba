import Image from "next/image"
import { Calendar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { HomeNews } from "@/lib/homeUtils"

export function FeaturedNewsCard({ news }: { news: HomeNews }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <Image
          src={news.imagen || "/placeholder.svg"}
          alt={news.titulo}
          fill
          sizes="(min-width: 1024px) 50vw, (min-width: 640px) 100vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 text-white">
        <div className="mb-3 flex flex-wrap gap-2">
          {news.categorias.slice(0, 3).map(category => (
            <Badge key={category} variant="outline" className="border-amber/50 bg-amber/10 text-amber-light backdrop-blur-sm text-xs">
              {category}
            </Badge>
          ))}
        </div>
        <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{news.titulo}</h2>
        <p className="mb-3 text-sm text-white/70 line-clamp-2 max-w-xl">{news.extracto}</p>
        <div className="flex items-center gap-2 text-sm text-amber-light">
          <Calendar className="h-4 w-4" />
          <span>{news.fecha}</span>
        </div>
      </div>
    </div>
  )
}

export function NewsCard({ news }: { news: HomeNews }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <Image
          src={news.imagen || "/placeholder.svg"}
          alt={news.titulo}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-5 text-white">
        <div className="mb-2 flex flex-wrap gap-1">
          {news.categorias.slice(0, 2).map(category => (
            <Badge key={category} variant="outline" className="border-amber/40 bg-amber/10 text-amber-light backdrop-blur-sm text-xs">
              {category}
            </Badge>
          ))}
        </div>
        <h3 className="mb-2 text-base font-bold leading-tight sm:text-lg">{news.titulo}</h3>
        <div className="flex items-center gap-1.5 text-xs text-amber-light/80">
          <Calendar className="h-3 w-3" />
          <span>{news.fecha}</span>
        </div>
      </div>
    </div>
  )
}
