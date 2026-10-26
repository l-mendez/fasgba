import Link from "next/link"
import { ChevronLeft, Mail, MapPin, Phone, Clock, Calendar, User, Heart, UserCheck, ImageIcon, Tag } from "lucide-react"
import { Metadata } from "next"

import { Button } from "@/components/ui/button"
import { InfoPill } from "@/components/info-pill"
import { formatArgentinaDateOnly } from "@/lib/dateUtils"
import {
  getClubById,
  getClubAdmins,
  getClubNews,
  isUserFollowingClubServer,
  getClubFollowersCount,
  type ClubWithStats,
  type ClubAdmin,
  type ClubNews
} from "@/lib/clubUtils"
import { getCurrentUserServer } from "@/lib/auth-server"
import { ClubFollowButton } from "@/components/club-follow-button"
import { createClient } from "@/lib/supabase/client"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

interface ClubDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate metadata for better link previews
export async function generateMetadata({ params }: ClubDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const clubId = parseInt(resolvedParams.id)
  
  if (isNaN(clubId)) {
    return {
      title: 'Club no encontrado - FASGBA',
      description: 'El club que estás buscando no existe o ha sido eliminado.',
    }
  }

  // Fetch the club data for metadata
  const clubData = await getClubById(clubId, true) as ClubWithStats | null
  
  if (!clubData) {
    return {
      title: 'Club no encontrado - FASGBA',
      description: 'El club que estás buscando no existe o ha sido eliminado.',
    }
  }

  // Create description from club info
  const description = `${clubData.name} - Club afiliado a FASGBA. ${clubData.address ? `Ubicado en ${clubData.address}. ` : ''}Información de contacto, horarios y actividades disponibles.`

  // Build the full URL for the club
  const url = `https://fasgba.com/clubes/${clubId}`
  
  // Get the club image URL
  const imageUrl = clubData.image ? 
    (clubData.image.startsWith('http') ? clubData.image : `https://fasgba.com${clubData.image}`) 
    : `https://fasgba.com/images/fasgba-logo.png`

  return {
    title: `${clubData.name} - FASGBA`,
    description,
    keywords: ['FASGBA', 'club', 'ajedrez', clubData.name, clubData.address ? clubData.address.split(',')[0] : '', 'federación'].filter(Boolean),
    openGraph: {
      title: clubData.name,
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
      title: clubData.name,
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

interface ClubPageData {
  club: ClubWithStats | null
  admins: ClubAdmin[]
  news: ClubNews[]
  followersCount: number
  isFollowing: boolean
  user: any | null
  error: string | null
}

async function loadClubData(clubId: number): Promise<ClubPageData> {
  try {
    // Get current user for follow status
    const user = await getCurrentUserServer()
    
    // Load club basic info with stats
    const clubData = await getClubById(clubId, true) as ClubWithStats | null
    if (!clubData) {
      return {
        club: null,
        admins: [],
        news: [],
        followersCount: 0,
        isFollowing: false,
        user,
        error: "Club no encontrado"
      }
    }

    // Load additional data in parallel
    const [adminsData, newsData, followersCountData, isFollowingData] = await Promise.all([
      getClubAdmins(clubId),
      getClubNews(clubId, 5), // Limit to 5 most recent news
      getClubFollowersCount(clubId),
      user ? isUserFollowingClubServer(clubId, user.id) : false
    ])

    return {
      club: clubData,
      admins: adminsData,
      news: newsData,
      followersCount: followersCountData,
      isFollowing: isFollowingData,
      user,
      error: null
    }
  } catch (error) {
    console.error('Error loading club data:', error)
    return {
      club: null,
      admins: [],
      news: [],
      followersCount: 0,
      isFollowing: false,
      user: null,
      error: "Error al cargar los datos del club"
    }
  }
}

export default async function ClubDetailPage({ params }: ClubDetailPageProps) {
  const resolvedParams = await params
  const clubId = parseInt(resolvedParams.id)

  if (isNaN(clubId)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          ID de club inválido
        </h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          El enlace que has seguido no es válido.
        </p>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/clubes">Volver a clubes</Link>
        </Button>
      </div>
    )
  }

  const { club, admins, news, followersCount, isFollowing, user, error } = await loadClubData(clubId)

  if (error || !club) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          {error || "Club no encontrado"}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          {error || "El club que estás buscando no existe o ha sido eliminado."}
        </p>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/clubes">Volver a clubes</Link>
        </Button>
      </div>
    )
  }

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
                {user && (
                  <ClubFollowButton clubId={club.id} initialIsFollowing={isFollowing} isUserAuthenticated={!!user} />
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
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-amber" />
                    <a href={`tel:${club.telephone}`} className="hover:text-foreground hover:underline">{club.telephone}</a>
                  </li>
                )}
                {club.mail && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-amber" />
                    <a href={`mailto:${club.mail}`} className="break-all hover:text-foreground hover:underline">{club.mail}</a>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Heart className="h-4 w-4 shrink-0 text-amber" />
                  <span>{followersCount} seguidor{followersCount !== 1 ? 'es' : ''}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">Noticias</h2>
            {news.length === 0 ? (
              <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Sin noticias.</p>
            ) : (
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
            )}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">Administradores</h2>
            {admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin administradores.</p>
            ) : (
              <ul className="space-y-1.5 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                {admins.map((admin) => (
                  <li key={admin.id} className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 shrink-0 text-amber" />
                    <a href={`mailto:${admin.email}`} className="break-all hover:text-foreground hover:underline">
                      {admin.email}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
