import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, MapPin } from "lucide-react"

import { JsonLd } from "@/components/json-ld"
import { PageHero } from "@/components/page-hero"
import { loadPartidoData } from "@/lib/partido-data"
import { PARTIDOS } from "@/lib/partidos"
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo"

// Purged with the partido pages (revalidatePath('/ajedrez')).
export const revalidate = false

export const metadata: Metadata = pageMetadata({
  title: "Ajedrez en zona sur: dónde jugar, clases y torneos",
  description:
    "Dónde jugar y aprender ajedrez en la zona sur del Gran Buenos Aires: clubes, clases, torneos y mejores jugadores en Avellaneda, Lanús, Lomas de Zamora, Quilmes, Almirante Brown y Esteban Echeverría.",
  path: "/ajedrez",
})

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`

export default async function AjedrezZonaSurPage() {
  const partidos = await Promise.all(PARTIDOS.map(loadPartidoData))

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Ajedrez en zona sur", path: "/ajedrez" },
        ])}
      />
      <PageHero title="Ajedrez en zona sur" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
          {partidos.map(({ partido, clubs, profesores, topPlayers }) => (
            <article
              key={partido.slug}
              className="group relative flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-amber"
            >
              <h2 className="text-lg font-semibold text-terracotta">
                <Link href={`/ajedrez/${partido.slug}`} className="after:absolute after:inset-0 group-hover:underline">
                  Ajedrez en {partido.name}
                </Link>
              </h2>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {partido.localities.join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {[
                  plural(clubs.length, "club", "clubes"),
                  profesores.length > 0 && plural(profesores.length, "profesor", "profesores"),
                  topPlayers.length > 0 && "ranking local",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-terracotta">
                Ver clubes, clases y torneos
                <ChevronRight className="h-4 w-4" />
              </span>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
