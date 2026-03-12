import Link from "next/link"
import { ArrowLeft, MapPin, GraduationCap, Calendar, Mail, Phone, DollarSign } from "lucide-react"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getProfesorById } from "@/lib/profesorUtils"
import { createClient } from "@/lib/supabase/client"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
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

  const getImageUrl = (fotoPath: string | null) => {
    if (!fotoPath) return null
    const supabase = createClient()
    const { data } = supabase.storage.from('images').getPublicUrl(fotoPath)
    return data.publicUrl
  }

  const imageUrl = getImageUrl(profesor.foto)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/profesores" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <Button variant="ghost" size="sm" asChild className="mb-8">
              <Link href="/profesores">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Profesores
              </Link>
            </Button>

            <div className="grid gap-8 md:grid-cols-[300px_1fr]">
              {/* Photo */}
              <div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Foto de ${profesor.titulo}`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-20 w-20 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-terracotta mb-2">
                    {profesor.titulo}
                  </h1>
                  <Badge variant="secondary" className={modalidadColors[profesor.modalidad]}>
                    {modalidadLabels[profesor.modalidad]}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {profesor.club_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-5 w-5 shrink-0" />
                      <span>Club: <strong>{profesor.club_name}</strong></span>
                    </div>
                  )}

                  {profesor.zona && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5 shrink-0" />
                      <span>{profesor.zona}</span>
                    </div>
                  )}

                  {profesor.anio_nacimiento && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-5 w-5 shrink-0" />
                      <span>Año de nacimiento: {profesor.anio_nacimiento}</span>
                    </div>
                  )}

                  {profesor.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-5 w-5 shrink-0" />
                      <a href={`mailto:${profesor.email}`} className="hover:underline text-amber">
                        {profesor.email}
                      </a>
                    </div>
                  )}

                  {profesor.telefono && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-5 w-5 shrink-0" />
                      <a href={`tel:${profesor.telefono}`} className="hover:underline text-amber">
                        {profesor.telefono}
                      </a>
                    </div>
                  )}

                  {profesor.tarifa_horaria && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-5 w-5 shrink-0" />
                      <span>{profesor.tarifa_horaria}</span>
                    </div>
                  )}
                </div>

                {profesor.biografia && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Reseña Biográfica</h2>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {profesor.biografia}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
