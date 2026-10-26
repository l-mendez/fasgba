import Link from "next/link"
import { Building2, ChevronRight, GraduationCap, Mail, MapPin, Phone } from "lucide-react"
import { Metadata } from "next"

import { getAllProfesores, type ProfesorWithClub } from "@/lib/profesorUtils"
import { PageHero } from "@/components/page-hero"
import { InfoPill } from "@/components/info-pill"
import { getModalidades } from "@/lib/profesorModalidad"
import { getImageUrlNullable } from "@/lib/imageUtils"
import { safe } from "@/lib/utils/safe"

// Cached indefinitely, purged by revalidateProfesoresCache on mutation.
export const revalidate = false

export const metadata: Metadata = {
  title: 'Profesores',
  description: 'Directorio de profesores de ajedrez de la Federación de Ajedrez del Sur del Gran Buenos Aires. Encuentra profesores presenciales y virtuales.',
  keywords: ['FASGBA', 'profesores', 'ajedrez', 'clases', 'enseñanza', 'Buenos Aires'],
  openGraph: {
    title: 'Profesores de Ajedrez - FASGBA',
    description: 'Directorio de profesores de ajedrez de la Federación de Ajedrez del Sur del Gran Buenos Aires.',
    url: 'https://fasgba.com/profesores',
    siteName: 'FASGBA',
    locale: 'es_AR',
    type: 'website',
  },
}

async function ProfesoresList() {
  const profesores = await safe(getAllProfesores, [] as ProfesorWithClub[], "Error fetching profesores:")

  if (profesores.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">No hay profesores disponibles.</p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {profesores.map((profesor) => {
        const imageUrl = getImageUrlNullable(profesor.foto)

        return (
          // The title link stretches over the whole card; contact links sit above it.
          <article
            key={profesor.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-amber"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={`Foto de ${profesor.titulo}`} className="aspect-[4/3] w-full object-cover object-top" />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                <GraduationCap className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-tight">
                  <Link
                    href={`/profesores/${profesor.id}`}
                    className="text-terracotta after:absolute after:inset-0 group-hover:underline"
                  >
                    {profesor.titulo}
                  </Link>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {getModalidades(profesor.modalidad).map(({ label, icon }) => (
                    <InfoPill key={label} icon={icon}>{label}</InfoPill>
                  ))}
                </div>
              </div>

              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {profesor.club_name && (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profesor.club_name}</span>
                  </li>
                )}
                {profesor.zona && (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profesor.zona}</span>
                  </li>
                )}
                {profesor.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${profesor.email}`} className="relative z-10 truncate hover:text-foreground hover:underline">
                      {profesor.email}
                    </a>
                  </li>
                )}
                {profesor.telefono && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${profesor.telefono}`} className="relative z-10 hover:text-foreground hover:underline">
                      {profesor.telefono}
                    </a>
                  </li>
                )}
              </ul>

              {profesor.biografia && (
                <p className="text-sm text-muted-foreground line-clamp-3">{profesor.biografia}</p>
              )}

              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-terracotta">
                Ver perfil completo
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function ProfesoresPage() {
  return (
    <>
      <PageHero title="Profesores" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <ProfesoresList />
        </div>
      </section>
    </>
  )
}
