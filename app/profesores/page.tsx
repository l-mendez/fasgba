import Link from "next/link"
import { MapPin, GraduationCap, Mail, Phone } from "lucide-react"
import { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllProfesores, type ProfesorWithClub } from "@/lib/profesorUtils"
import { createClient } from "@/lib/supabase/client"

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Profesores de Ajedrez - FASGBA',
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

const modalidadLabels: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  ambos: 'Presencial y Virtual',
}

const modalidadColors: Record<string, string> = {
  presencial: 'bg-green-100 text-green-800',
  virtual: 'bg-blue-100 text-blue-800',
  ambos: 'bg-purple-100 text-purple-800',
}

function getProfesorImageUrl(fotoPath: string | null) {
  if (!fotoPath) return null
  const supabase = createClient()
  const { data } = supabase.storage.from('images').getPublicUrl(fotoPath)
  return data.publicUrl
}

async function ProfesoresList() {
  const profesores = await getAllProfesores()

  if (profesores.length === 0) {
    return (
      <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No hay profesores disponibles
        </h3>
        <p className="text-muted-foreground">
          Vuelve más tarde para ver el directorio de profesores.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[400px]">
      {profesores.map((profesor) => {
        const imageUrl = getProfesorImageUrl(profesor.foto)

        return (
          <Card key={profesor.id} className="flex flex-col group hover:border-amber transition-colors">
            {imageUrl ? (
              <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                <img
                  src={imageUrl}
                  alt={`Foto de ${profesor.titulo}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="aspect-square w-full bg-muted rounded-t-lg flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            <CardHeader>
              <CardTitle>
                <Link href={`/profesores/${profesor.id}`} className="text-terracotta hover:underline">
                  {profesor.titulo}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <Badge variant="secondary" className={modalidadColors[profesor.modalidad]}>
                  {modalidadLabels[profesor.modalidad]}
                </Badge>

                {profesor.club_name && (
                  <p className="text-sm text-muted-foreground">
                    Club: {profesor.club_name}
                  </p>
                )}

                {profesor.zona && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {profesor.zona}
                  </div>
                )}

                {profesor.email && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${profesor.email}`} className="hover:underline truncate">
                      {profesor.email}
                    </a>
                  </div>
                )}

                {profesor.telefono && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${profesor.telefono}`} className="hover:underline">
                      {profesor.telefono}
                    </a>
                  </div>
                )}

                {profesor.biografia && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {profesor.biografia}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href={`/profesores/${profesor.id}`}
                className="text-sm font-medium text-amber hover:underline"
              >
                Ver perfil completo
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

export default function ProfesoresPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/profesores" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">Profesores de Ajedrez</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conoce a los profesores de ajedrez asociados a FASGBA. Clases presenciales y virtuales.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-muted-foreground">Directorio de Profesores</h2>
              <p className="text-muted-foreground">
                Encuentra al profesor ideal para mejorar tu juego
              </p>
            </div>

            <ProfesoresList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
