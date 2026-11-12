import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { ClubCards } from "@/components/clubs-grid"
import { TopRanking } from "@/components/home/top-ranking"
import { JsonLd } from "@/components/json-ld"
import { PageHero } from "@/components/page-hero"
import { ProfesorCard } from "@/components/profesor-card"
import { TournamentCard } from "@/app/(public)/torneos/components/tournament-card"
import { getPartido, PARTIDOS } from "@/lib/partidos"
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, type JsonLdObject } from "@/lib/seo"
import { loadPartidoData, type PartidoData } from "@/lib/partido-data"

// Prerendered per partido and purged by the clubs, profesores, torneos and
// ranking invalidators (revalidatePath('/ajedrez/[partido]', 'page')).
export const revalidate = false
export const dynamicParams = false

type PageProps = { params: Promise<{ partido: string }> }

export function generateStaticParams() {
  return PARTIDOS.map(({ slug }) => ({ partido: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const partido = getPartido((await params).partido)
  if (!partido) return {}
  return pageMetadata({
    title: `Ajedrez en ${partido.name}: clubes, clases y torneos`,
    description: `Dónde jugar al ajedrez en ${partido.name} (${partido.localities.slice(1, 4).join(", ")}): clubes de ajedrez, clases y profesores, torneos y los mejores jugadores del ranking FASGBA.`,
    path: `/ajedrez/${partido.slug}`,
  })
}

function partidoJsonLd({ partido, clubs }: PartidoData): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Ajedrez en ${partido.name}`,
    url: absoluteUrl(`/ajedrez/${partido.slug}`),
    inLanguage: "es-AR",
    about: { "@type": "City", name: `${partido.name}, Buenos Aires, Argentina` },
    mainEntity: {
      "@type": "ItemList",
      name: `Clubes de ajedrez en ${partido.name}`,
      itemListElement: clubs.map((club, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/clubes/${club.id}`),
        name: club.name,
      })),
    },
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-terracotta">{title}</h2>
      {children}
    </section>
  )
}

export default async function PartidoPage({ params }: PageProps) {
  const partido = getPartido((await params).partido)
  if (!partido) notFound()
  const data = await loadPartidoData(partido)
  const { clubs, profesores, tournaments, tournamentsAreUpcoming, topPlayers } = data

  return (
    <>
      <JsonLd
        data={[
          partidoJsonLd(data),
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Ajedrez en zona sur", path: "/ajedrez" },
            { name: partido.name, path: `/ajedrez/${partido.slug}` },
          ]),
        ]}
      />
      <div className="container px-4 pt-8 md:px-6 md:pt-12">
        <Link
          href="/ajedrez"
          className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Zona sur
        </Link>
      </div>
      <PageHero title={`Ajedrez en ${partido.name}`} />
      <div className="container space-y-10 px-4 pt-6 pb-12 md:px-6 md:pt-8 md:pb-16">
        {clubs.length > 0 && (
          <Section title={`Clubes de ajedrez en ${partido.name}`}>
            <ClubCards clubs={clubs} />
          </Section>
        )}

        {profesores.length > 0 && (
          <Section title={`Clases de ajedrez en ${partido.name}`}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profesores.map((profesor) => (
                <ProfesorCard key={profesor.id} profesor={profesor} />
              ))}
            </div>
          </Section>
        )}

        {tournaments.length > 0 && (
          <Section title={`${tournamentsAreUpcoming ? "Próximos torneos" : "Torneos"} de ajedrez en ${partido.name}`}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map(({ torneo, status }) => (
                <TournamentCard key={torneo.id} torneo={torneo} status={status} />
              ))}
            </div>
          </Section>
        )}

        {topPlayers.length > 0 && (
          <Section title={`Mejores jugadores de ajedrez de ${partido.name}`}>
            <TopRanking players={topPlayers} />
          </Section>
        )}
      </div>
    </>
  )
}
