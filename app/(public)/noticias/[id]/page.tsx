import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"
import { Building2, Calendar, ChevronLeft, Tag, User } from "lucide-react"

import { InfoPill } from "@/components/info-pill"
import { NewsCard } from "@/components/news-card"
import { getNewsById, getRelatedNews } from "@/lib/newsUtils"
import { getImageUrlNullable } from "@/lib/imageUtils"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { buildNoticiasUrl, FEDERATION_NAME } from "@/lib/newsDisplay"
import { extractShortTextFromContentBlocks } from "@/lib/textUtils"
import { NewsContent } from "./news-content"

// No time-based revalidation. The build marks this route dynamic (rendered per
// request, absent from prerender-manifest's dynamicRoutes), so there is no ISR
// entry to expire today; the export guards against reintroducing a per-article
// timer if it ever becomes prerenderable. revalidateNewsCache(id) already purges
// `/noticias/${id}` on edit or delete, so that path is covered either way.
export const revalidate = false

// Generate metadata for better link previews
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const newsItem = await getNewsById(parseInt(id), ['club', 'author'])

  if (!newsItem) {
    return {
      title: 'Noticia no encontrada - FASGBA',
      description: 'La noticia que estás buscando no existe o ha sido eliminada.',
    }
  }

  // Create a description from extract or extracted plain text
  let description = newsItem.extract || ''
  if (!description && newsItem.text) {
    description = extractShortTextFromContentBlocks(newsItem.text, 160)
  }
  if (!description) {
    description = 'Lee la noticia completa en FASGBA'
  }

  const author = newsItem.author_name || (newsItem.club?.name ? `${newsItem.club.name}` : 'FASGBA')

  return {
    title: `${newsItem.title} - FASGBA`,
    description,
    authors: [{ name: author }],
  }
}

function BackLink() {
  return (
    <Link
      href="/noticias"
      className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
    >
      <ChevronLeft className="h-4 w-4" />
      Noticias
    </Link>
  )
}

export default async function NoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const newsItem = await getNewsById(parseInt(id), ['club', 'author'])

  if (!newsItem) {
    return (
      <section className="container px-4 pt-8 pb-12 md:px-6 md:pt-12 md:pb-16">
        <BackLink />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-terracotta">Noticia no encontrada</h1>
        <p className="mt-2 text-muted-foreground">La noticia no existe o fue eliminada.</p>
      </section>
    )
  }

  // Fetch related news (limit 3 since the util filters out current after limiting)
  const relatedNews = (await getRelatedNews(newsItem.id, 3)).slice(0, 2)
  const imageUrl = getImageUrlNullable(newsItem.image)
  const tags = newsItem.tags ?? []

  return (
    <>
      <article className="container max-w-3xl px-4 pt-8 pb-12 md:px-6 md:pt-12 md:pb-16">
        <BackLink />

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-terracotta md:text-4xl">
          {newsItem.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            {formatArgentinaDateOnly(newsItem.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 shrink-0" />
            {newsItem.club ? (
              <Link href={`/clubes/${newsItem.club.id}`} className="hover:text-foreground hover:underline">
                {newsItem.club.name}
              </Link>
            ) : (
              FEDERATION_NAME
            )}
          </span>
          {newsItem.author_name && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 shrink-0" />
              {newsItem.author_name}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={buildNoticiasUrl({ tag })}
                className="rounded-full hover:[&>span]:border-amber hover:[&>span]:text-foreground"
              >
                <InfoPill icon={Tag}>{tag}</InfoPill>
              </Link>
            ))}
          </div>
        )}

        {imageUrl && (
          <Image
            src={imageUrl}
            alt={newsItem.title}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            unoptimized
            className="mt-6 h-auto w-full rounded-lg border"
          />
        )}

        <div className="mt-6">
          <NewsContent text={newsItem.text} />
        </div>
      </article>

      {relatedNews.length > 0 && (
        <section className="w-full pb-12 md:pb-16">
          <div className="container max-w-3xl px-4 md:px-6">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">Noticias relacionadas</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedNews.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
