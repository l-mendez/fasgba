import { Suspense } from "react"
import { unstable_cache } from "next/cache"

import { NewsList } from "@/components/news-list"
import { PageHero } from "@/components/page-hero"
import { getAllNews, getAllNewsTags } from "@/lib/newsUtils"
import { getAllClubs } from "@/lib/clubUtils"
import type { NewsDisplay } from "@/lib/newsUtils"
import type { Club } from "@/lib/clubUtils"

// ISR: Revalidate every 5 minutes (300 seconds). The whole catalog is identical
// for everyone, so it's fetched once and cached; filtering/pagination happen on
// the client (see NewsList), keeping this page statically cacheable.
export const revalidate = 300

// Ship the full news catalog as card metadata. The heavy article body (`text`)
// is dropped here so the client payload stays small.
const getCachedAllNews = unstable_cache(
  async (): Promise<NewsDisplay[]> => {
    const { data } = await getAllNews({ limit: 5000, include: ["club"] })
    return data.map((item) => ({ ...item, text: "" }))
  },
  ["noticias-all-news"],
  { revalidate: 300, tags: ["news"] }
)

const getCachedTags = unstable_cache(
  (): Promise<string[]> => getAllNewsTags(),
  ["news-tags"],
  { revalidate: 300, tags: ["news"] }
)

const getCachedClubs = unstable_cache(
  (): Promise<Club[]> => getAllClubs(),
  ["clubs-list"],
  { revalidate: 300, tags: ["clubs"] }
)

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(label, error)
    return fallback
  }
}

export default async function NoticiasPage() {
  const [allNews, tags, clubs] = await Promise.all([
    safe(getCachedAllNews, [] as NewsDisplay[], "Error fetching news:"),
    safe(getCachedTags, [] as string[], "Error fetching tags:"),
    safe(getCachedClubs, [] as Club[], "Error fetching clubs:"),
  ])

  return (
    <>
      <PageHero
        title="Noticias"
        subtitle="Mantenete al día con las últimas novedades del ajedrez en la región sur de Buenos Aires"
      />

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <NewsList allNews={allNews} tags={tags} clubs={clubs} />
          </Suspense>
        </div>
      </section>
    </>
  )
}
