import { Metadata } from "next"
import { unstable_cache } from "next/cache"

import { NewsList } from "@/components/news-list"
import { PageHero } from "@/components/page-hero"
import { getAllNews, getAllNewsTags } from "@/lib/newsUtils"
import { getAllClubs } from "@/lib/clubUtils"
import { safe } from "@/lib/utils/safe"
import type { NewsDisplay } from "@/lib/newsUtils"
import type { Club } from "@/lib/clubUtils"
import { pageMetadata } from '@/lib/seo'

// Cached indefinitely, purged by revalidateNewsCache on mutation. The whole
// catalog is identical for everyone, so it's fetched once and cached;
// filtering/pagination happen on the client (see NewsList), keeping this page
// statically cacheable.
export const revalidate = false

// Upper bound on rows shipped to the client. The dataset is small, so a single
// generous cap fetches the entire catalog in one request.
const MAX_NEWS = 5000

// Generate metadata for better link previews
export const metadata: Metadata = pageMetadata({
  title: 'Noticias',
  description:
    'Noticias del ajedrez en la zona sur del Gran Buenos Aires: torneos, resultados y novedades de FASGBA y sus clubes afiliados.',
  path: '/noticias',
})

// Ship the full news catalog as card metadata. The heavy article body (`text`)
// is dropped here so the client payload stays small.
const getCachedAllNews = unstable_cache(
  async (): Promise<NewsDisplay[]> => {
    const { data } = await getAllNews({ limit: MAX_NEWS, include: ["club"] })
    return data.map((item) => ({ ...item, text: "" }))
  },
  ["noticias-all-news"],
  { revalidate: false, tags: ["news"] }
)

const getCachedTags = unstable_cache(
  (): Promise<string[]> => getAllNewsTags(),
  ["news-tags"],
  { revalidate: false, tags: ["news"] }
)

const getCachedClubs = unstable_cache(
  (): Promise<Club[]> => getAllClubs(),
  ["clubs-list"],
  { revalidate: false, tags: ["clubs"] }
)

export default async function NoticiasPage() {
  const [allNews, tags, clubs] = await Promise.all([
    safe(getCachedAllNews, [] as NewsDisplay[], "Error fetching news:"),
    safe(getCachedTags, [] as string[], "Error fetching tags:"),
    safe(getCachedClubs, [] as Club[], "Error fetching clubs:"),
  ])

  return (
    <>
      <PageHero title="Noticias" />

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <NewsList allNews={allNews} tags={tags} clubs={clubs} />
        </div>
      </section>
    </>
  )
}
