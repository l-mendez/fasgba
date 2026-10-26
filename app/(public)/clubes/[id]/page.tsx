import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, Mail, MapPin, Phone, Clock, Calendar, User, Heart, ImageIcon, Tag, Users } from "lucide-react"
import { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import { getClubNews, isUserFollowingClubServer, getClubFollowersCount } from "@/lib/clubUtils"
import { getCurrentUserServer } from "@/lib/auth-server"
import { ClubFollowButton } from "@/components/club-follow-button"
import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { PhoneLinks } from "./phone-links"
import { getClubCached, parseClubId } from "./club-data"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

interface ClubDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate metadata for better link previews
export async function generateMetadata({ params }: ClubDetailPageProps): Promise<Metadata> {
  const clubId = parseClubId((await params).id)
  const clubData = clubId ? await getClubCached(clubId) : null
  if (!clubId || !clubData) return { title: 'Club no encontrado | FASGBA' }

  // Create description from club info
  const description = `${clubData.name} - Club afiliado a FASGBA. ${clubData.address ? `Ubicado en ${clubData.address}. ` : ''}Información de contacto, horarios y actividades disponibles.`

  // Build the full URL for the club
  const url = `https://fasgba.com/clubes/${clubId}`
  
  // Get the club image URL
  const imageUrl = clubData.image ? 
    (clubData.image.startsWith('http') ? clubData.image : `https://fasgba.com${clubData.image}`) 
    : `https://fasgba.com/images/fasgba-logo.png`

  return {
    title: `${clubData.name} | FASGBA`,
    description,
    keywords: ['FASGBA', 'club', 'ajedrez', clubData.name, clubData.address ? clubData.address.split(',')[0] : '', 'federación'].filter(Boolean),
    openGraph: {
      title: `${clubData.name} | FASGBA`,
      description,
      url,
      siteName: 'FASGBA',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${clubData.name} - Club FASGBA`,
        }
      ],
      locale: 'es_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${clubData.name} | FASGBA`,
      description,
      images: [imageUrl],
      creator: '@FASGBA',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'business:contact_data:locality': clubData.address ? clubData.address.split(',')[0] : '',
      'business:contact_data:phone_number': clubData.telephone || '',
      'business:contact_data:email': clubData.mail || '',
    },
  }
}

async function loadClubData(clubId: number) {
  const club = await getClubCached(clubId)
  if (!club) return null

  const user = await getCurrentUserServer()
  const supabase = await createServerClient()
  const [news, followersCount, isFollowing, teamsResult] = await Promise.all([
    getClubNews(clubId, 5).catch(() => []),
    getClubFollowersCount(clubId).catch(() => 0),
    user ? isUserFollowingClubServer(clubId, user.id).catch(() => false) : false,
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
  ])

  return { club, user, news, followersCount, isFollowing, teamsCount: teamsResult.count ?? 0 }
}

const linkClass = "hover:text-foreground hover:underline"

export default async function ClubDetailPage({ params }: ClubDetailPageProps) {
  const clubId = parseClubId((await params).id)
  const data = clubId ? await loadClubData(clubId) : null
  if (!data) notFound()
  const { club, user, news, followersCount, isFollowing, teamsCount } = data

  const imageUrl = club.image
    ? createClient().storage.from('images').getPublicUrl(club.image).data.publicUrl
    : null

  return (
    <>
      <section className="w-full pt-8 md:pt-12">
        <div className="container space-y-4 px-4 md:px-6">
          <Link
            href="/clubes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Clubes
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white md:h-36 md:w-36">
              {imageUrl ? (
                <img src={imageUrl} alt={`Imagen de ${club.name}`} className="h-full w-full object-contain p-2" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="break-words text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{club.name}</h1>
                {user ? (
                  <ClubFollowButton clubId={club.id} initialIsFollowing={isFollowing} isUserAuthenticated />
                ) : (
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/login?redirect=/clubes/${club.id}`} aria-label="Seguir club" title="Seguir club">
                      <Heart />
                    </Link>
                  </Button>
                )}
              </div>

              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {club.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    <span className="break-words">{club.address}</span>
                  </li>
                )}
                {club.schedule && (
                  <li className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    <span className="whitespace-pre-line break-words">{club.schedule}</span>
                  </li>
                )}
                {club.telephone && (
                  <li className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                    <span className="break-words">
                      <PhoneLinks value={club.telephone} className={linkClass} />
                    </span>
                  </li>
                )}
                {club.mail && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-amber" />
                    <a href={`mailto:${club.mail}`} className={`break-all ${linkClass}`}>{club.mail}</a>
                  </li>
                )}
                {teamsCount > 0 && (
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-amber" />
                    <Link href={`/clubes/${club.id}/equipos`} className={linkClass}>
                      {teamsCount} equipo{teamsCount !== 1 ? 's' : ''}
                    </Link>
                  </li>
                )}
                {followersCount > 0 && (
                  <li className="flex items-center gap-2">
                    <Heart className="h-4 w-4 shrink-0 text-amber" />
                    <span>{followersCount} seguidor{followersCount !== 1 ? 'es' : ''}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-terracotta">Noticias</h2>
                <Link
                  href={`/noticias?club=${club.id}`}
                  className="flex shrink-0 items-center gap-1 text-sm font-bold text-terracotta underline-offset-4 hover:underline"
                >
                  Ver todas
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="space-y-3">
                {news.map((article) => (
                  <li
                    key={article.id}
                    className="group relative space-y-2 rounded-lg border bg-card p-4 transition-colors hover:border-amber"
                  >
                    <h3 className="text-lg font-semibold leading-tight">
                      <Link
                        href={`/noticias/${article.id}`}
                        className="break-words text-terracotta after:absolute after:inset-0 group-hover:underline"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatArgentinaDateOnly(article.date)}
                      </span>
                      {article.author_name && (
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {article.author_name}
                        </span>
                      )}
                    </div>
                    {article.extract && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{article.extract}</p>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags.map((tag) => (
                          <InfoPill key={tag} icon={Tag}>{tag}</InfoPill>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
