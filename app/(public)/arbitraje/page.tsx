import Link from "next/link"
import { Award, Calendar, Mail, Phone, User } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { unstable_cache } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { PageHero } from "@/components/page-hero"

export const revalidate = 60

interface ArbitroWithClub {
  id: number
  name: string
  title: string
  photo: string | null
  club_name: string | null
  birth_year: number | null
  bio: string | null
  email: string | null
  phone: string | null
}

async function fetchArbitros(): Promise<ArbitroWithClub[]> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('arbitros')
      .select('*, clubs(name)')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching arbitros:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      title: item.title,
      photo: item.photo,
      club_name: item.clubs?.name || null,
      birth_year: item.birth_year,
      bio: item.bio,
      email: item.email,
      phone: item.phone,
    }))
  } catch (error) {
    console.error('Error fetching arbitros:', error)
    return []
  }
}

const getCachedArbitros = unstable_cache(
  (): Promise<ArbitroWithClub[]> => fetchArbitros(),
  ['arbitraje-list'],
  { revalidate: 60, tags: ['arbitros'] }
)

function getPhotoUrl(photo: string | null): string | null {
  if (!photo) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${photo}`
}

export default async function ArbitrajePage() {
  const arbitros = await getCachedArbitros()

  return (
    <>
      <PageHero
        title="Arbitraje"
        subtitle="Árbitros oficiales de la Federación de Ajedrez del Sur del Gran Buenos Aires"
      />
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Árbitros Oficiales</h2>
            <p className="text-muted-foreground">
              Listado de árbitros habilitados por FASGBA para dirigir torneos oficiales
            </p>
          </div>
          {arbitros.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No hay árbitros registrados actualmente.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arbitros.map((arbitro) => (
                <Card key={arbitro.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getPhotoUrl(arbitro.photo) || undefined} alt={arbitro.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{arbitro.name}</CardTitle>
                        <CardDescription>{arbitro.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      {arbitro.club_name && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{arbitro.club_name}</span>
                        </div>
                      )}
                      {arbitro.birth_year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">Año de nacimiento: {arbitro.birth_year}</span>
                        </div>
                      )}
                      {arbitro.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <a href={`mailto:${arbitro.email}`} className="text-sm text-primary hover:underline truncate">
                            {arbitro.email}
                          </a>
                        </div>
                      )}
                      {arbitro.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <a href={`tel:${arbitro.phone}`} className="text-sm text-primary hover:underline">
                            {arbitro.phone}
                          </a>
                        </div>
                      )}
                      {arbitro.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {arbitro.bio}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Recursos para Árbitros</h2>
          <Card>
            <CardHeader>
              <CardTitle>Documentos Oficiales</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/reglamentos/fide" className="text-primary hover:underline">
                Leyes del Ajedrez FIDE
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
