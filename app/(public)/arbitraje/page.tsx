import { Building2, Cake, Mail, Phone, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { unstable_cache } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { PageHero } from "@/components/page-hero"
import { getImageUrlNullable } from "@/lib/imageUtils"

// Cached indefinitely, purged by revalidateArbitrosCache on mutation.
export const revalidate = false

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
  { revalidate: false, tags: ['arbitros'] }
)

export default async function ArbitrajePage() {
  const arbitros = await getCachedArbitros()

  return (
    <>
      <PageHero title="Arbitraje" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          {arbitros.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No hay árbitros registrados actualmente.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arbitros.map((arbitro) => (
                <article key={arbitro.id} className="flex h-full min-w-0 flex-col gap-3 rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getImageUrlNullable(arbitro.photo) || undefined} alt={arbitro.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold leading-tight text-terracotta">{arbitro.name}</h3>
                      {arbitro.title && <p className="text-sm text-muted-foreground">{arbitro.title}</p>}
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {arbitro.club_name && (
                      <li className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate" title={arbitro.club_name}>{arbitro.club_name}</span>
                      </li>
                    )}
                    {arbitro.birth_year && (
                      <li className="flex items-center gap-2" title="Año de nacimiento">
                        <Cake className="h-4 w-4 shrink-0" />
                        <span>{arbitro.birth_year}</span>
                      </li>
                    )}
                    {arbitro.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        <a href={`mailto:${arbitro.email}`} className="truncate hover:underline" title={arbitro.email}>
                          {arbitro.email}
                        </a>
                      </li>
                    )}
                    {arbitro.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        <a href={`tel:${arbitro.phone}`} className="hover:underline">
                          {arbitro.phone}
                        </a>
                      </li>
                    )}
                  </ul>

                  {arbitro.bio && (
                    <p className="whitespace-pre-line text-sm text-muted-foreground line-clamp-3" title={arbitro.bio}>
                      {arbitro.bio}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
