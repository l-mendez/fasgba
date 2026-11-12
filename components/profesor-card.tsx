import Link from "next/link"
import Image from "next/image"
import { Building2, ChevronRight, GraduationCap, Mail, MapPin, Phone } from "lucide-react"

import { InfoPill } from "@/components/info-pill"
import { getModalidades } from "@/lib/profesorModalidad"
import { getImageUrlNullable } from "@/lib/imageUtils"
import type { ProfesorWithClub } from "@/lib/profesorUtils"

// Directory card; the title link stretches over the whole card and the contact
// links sit above it.
export function ProfesorCard({ profesor }: { profesor: ProfesorWithClub }) {
  const imageUrl = getImageUrlNullable(profesor.foto)

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-amber"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Foto de ${profesor.titulo}`}
          width={400}
          height={300}
          unoptimized
          loading="eager"
          className="aspect-[4/3] w-full object-cover object-top"
        />
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
}
