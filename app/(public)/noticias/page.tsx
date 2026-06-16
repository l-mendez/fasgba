import { Metadata } from "next"
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

// Upper bound on rows shipped to the client. The dataset is small, so a single
// generous cap fetches the entire catalog in one request.
const MAX_NEWS = 5000

// Generate metadata for better link previews
export const metadata: Metadata = {
  title: 'Noticias - FASGBA',
  description: 'Últimas novedades del ajedrez en la región sur de Buenos Aires. Noticias de la Federación de Ajedrez del Sur del Gran Buenos Aires y sus clubes afiliados.',
  keywords: ['FASGBA', 'noticias', 'ajedrez', 'novedades', 'federación', 'Buenos Aires', 'torneos'],
  openGraph: {
    title: 'Noticias - FASGBA',
    description: 'Últimas novedades del ajedrez en la región sur de Buenos Aires. Noticias de la Federación de Ajedrez del Sur del Gran Buenos Aires y sus clubes afiliados.',
    url: 'https://fasgba.com/noticias',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Noticias FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noticias - FASGBA',
    description: 'Últimas novedades del ajedrez en la región sur de Buenos Aires.',
    images: ['https://fasgba.com/images/fasgba-logo.png'],
    creator: '@FASGBA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Ship the full news catalog as card metadata. The heavy article body (`text`)
// is dropped here so the client payload stays small.
const getCachedAllNews = unstable_cache(
  async (): Promise<NewsDisplay[]> => {
    const { data } = await getAllNews({ limit: MAX_NEWS, include: ["club"] })
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
          <NewsList allNews={allNews} tags={tags} clubs={clubs} />
        </div>
      </section>
    </>
  )
}
