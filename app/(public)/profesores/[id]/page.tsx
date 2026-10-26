import Link from "next/link"
import { Building2, Cake, ChevronLeft, DollarSign, GraduationCap, Mail, MapPin, Phone } from "lucide-react"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { InfoPill } from "@/components/info-pill"
import { getModalidades } from "@/lib/profesorModalidad"
import { getProfesorById } from "@/lib/profesorUtils"
import { getImageUrlNullable } from "@/lib/imageUtils"

// No time-based revalidation. The build marks this route dynamic (rendered per
// request), so there is no ISR entry to expire today; the export guards against
// reintroducing a per-profesor timer if it ever becomes prerenderable. If that
// happens, both revalidateProfesoresCache(id) and revalidateClubsCache (for the
// club name joined in here) would have to purge this path.
export const revalidate = false

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profesorId = parseInt(id, 10)

  if (isNaN(profesorId)) {
    return { title: 'Profesor no encontrado - FASGBA' }
  }

  const profesor = await getProfesorById(profesorId)

  if (!profesor) {
    return { title: 'Profesor no encontrado - FASGBA' }
  }

  return {
    title: `${profesor.titulo} - Profesores FASGBA`,
    description: profesor.biografia || `Perfil del profesor ${profesor.titulo} en FASGBA.`,
  }
}

export default async function ProfesorDetailPage({ params }: PageProps) {
  const { id } = await params
  const profesorId = parseInt(id, 10)

  if (isNaN(profesorId)) {
    notFound()
  }

  const profesor = await getProfesorById(profesorId)

  if (!profesor) {
    notFound()
  }

  const imageUrl = getImageUrlNullable(profesor.foto)

  return (
    <section className="container px-4 pt-8 pb-12 md:px-6 md:pt-12 md:pb-16">
      <Link
        href="/profesores"
        className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Profesores
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr] md:gap-8">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Foto de ${profesor.titulo}`}
            className="aspect-[4/3] w-full rounded-lg border object-cover md:aspect-square"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted md:aspect-square">
            <GraduationCap className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{profesor.titulo}</h1>
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
                <span>{profesor.club_name}</span>
              </li>
            )}
            {profesor.zona && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{profesor.zona}</span>
              </li>
            )}
            {profesor.anio_nacimiento && (
              <li className="flex items-center gap-2" title="Año de nacimiento">
                <Cake className="h-4 w-4 shrink-0" />
                <span>{profesor.anio_nacimiento}</span>
              </li>
            )}
            {profesor.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${profesor.email}`} className="break-all text-terracotta hover:underline">
                  {profesor.email}
                </a>
              </li>
            )}
            {profesor.telefono && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${profesor.telefono}`} className="text-terracotta hover:underline">
                  {profesor.telefono}
                </a>
              </li>
            )}
            {profesor.tarifa_horaria && (
              <li className="flex items-center gap-2" title="Tarifa horaria">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>{profesor.tarifa_horaria}</span>
              </li>
            )}
          </ul>

          {profesor.biografia && (
            <p className="max-w-3xl whitespace-pre-line leading-relaxed">{profesor.biografia}</p>
          )}
        </div>
      </div>
    </section>
  )
}
