import Link from "next/link"
import { Newspaper } from "lucide-react"

import { ScrollReveal } from "@/components/scroll-reveal"
import type { HomeNews } from "@/lib/homeUtils"
import { FeaturedNewsCard, NewsCard } from "./news-card"
import { HomeSectionHeader } from "./section-header"

export function HomeNewsSection({ news }: { news: HomeNews[] }) {
  const featuredNews = news.find(item => item.destacada)
  const secondaryNews = news.filter(item => !item.destacada)

  return (
    <section className="w-full pt-8 pb-4 md:pt-12 md:pb-4">
      <div className="container px-4 md:px-6">
        <ScrollReveal>
          <HomeSectionHeader
            icon={Newspaper}
            title="Últimas Noticias"
            subtitle="Mantente al día con las novedades de FASGBA"
            action={{ href: "/noticias", label: "Ver todas" }}
          />
        </ScrollReveal>

        {news.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredNews && (
              <ScrollReveal className="sm:col-span-2 lg:col-span-2 h-[210px] sm:h-[240px] lg:h-[260px]">
                <Link href={`/noticias/${featuredNews.id}`} className="block h-full">
                  <FeaturedNewsCard news={featuredNews} />
                </Link>
              </ScrollReveal>
            )}

            {secondaryNews.slice(0, 2).map((item, index) => (
              <ScrollReveal key={item.id} delay={index * 100} className="h-[160px] sm:h-[180px] lg:h-[260px]">
                <Link href={`/noticias/${item.id}`} className="block h-full">
                  <NewsCard news={item} />
                </Link>
              </ScrollReveal>
            ))}

            {secondaryNews.length > 2 && (
              <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {secondaryNews.slice(2, 6).map((item, index) => (
                  <ScrollReveal key={item.id} delay={index * 100} className="h-[130px] lg:h-[150px]">
                    <Link href={`/noticias/${item.id}`} className="block h-full">
                      <NewsCard news={item} />
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
          </div>
        )}
      </div>
    </section>
  )
}
