import Link from "next/link"
import { ChevronLeft, Mail, MapPin, Phone, Clock, Calendar, User, Heart, Loader2, Users, UserCheck, FileText, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSiteHeader } from "@/components/client-site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getClubById,
  getClubAdmins,
  getClubNews,
  isUserFollowingClubServer,
  getClubFollowersCount,
  type Club,
  type ClubWithStats,
  type ClubAdmin,
  type ClubNews
} from "@/lib/clubUtils"
import { getCurrentUserServer } from "@/lib/auth-server"
import { ClubFollowButton } from "@/components/club-follow-button"

// Force dynamic rendering for SSR
export const dynamic = 'force-dynamic'

interface ClubDetailPageProps {
  params: Promise<{
    id: string
  }>
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
      <div className="flex min-h-screen flex-col">
        <ClientSiteHeader pathname={`/clubes/${clubId}`} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
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
        </main>
        <SiteFooter />
      </div>
    )
  }

  const { club, admins, news, followersCount, isFollowing, user, error } = await loadClubData(clubId)

  if (error || !club) {
    return (
      <div className="flex min-h-screen flex-col">
        <ClientSiteHeader pathname={`/clubes/${clubId}`} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
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
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ClientSiteHeader pathname={`/clubes/${clubId}`} />
      <main className="flex-1">
        <section className="w-full py-6 sm:py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <Button asChild variant="outline" size="sm" className="mb-4 sm:mb-6">
              <Link href="/clubes">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a clubes
              </Link>
            </Button>

            {/* Club Header */}
            <div className="mb-8 lg:mb-12">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 break-words">
                    {club.name}
                  </h1>
                  
                  {/* Quick Stats Bar */}
                  <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{club.adminCount} administradores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{followersCount} seguidores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{club.newsCount} noticias</span>
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                {user && (
                  <div className="lg:flex-shrink-0">
                    <ClubFollowButton 
                      clubId={club.id} 
                      initialIsFollowing={isFollowing} 
                      isUserAuthenticated={!!user}
                      className="w-full lg:w-auto"
                      size="lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Contact Information */}
                {(club.address || club.telephone || club.mail || club.schedule) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Información de Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {club.address && (
                          <div className="flex gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Dirección</p>
                              <p className="text-sm text-muted-foreground break-words">{club.address}</p>
                            </div>
                          </div>
                        )}
                        {club.telephone && (
                          <div className="flex gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Teléfono</p>
                              <p className="text-sm text-muted-foreground">{club.telephone}</p>
                            </div>
                          </div>
                        )}
                        {club.mail && (
                          <div className="flex gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground break-all">{club.mail}</p>
                            </div>
                          </div>
                        )}
                        {club.schedule && (
                          <div className="flex gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Horarios</p>
                              <p className="text-sm text-muted-foreground break-words">{club.schedule}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* News Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Últimas Noticias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {news.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm sm:text-base">No hay noticias disponibles para este club.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {news.map((article, index) => (
                          <div key={article.id}>
                            <Link href={`/noticias/${article.id}`} className="block group">
                              <article className="space-y-3 cursor-pointer hover:bg-muted/30 p-3 rounded-lg transition-colors">
                                <div>
                                  <h3 className="text-lg font-bold break-words group-hover:text-primary transition-colors">{article.title}</h3>
                                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>{new Date(article.date).toLocaleDateString()}</span>
                                    </div>
                                    {article.author_name && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>Por {article.author_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {article.extract && (
                                  <p className="text-muted-foreground leading-relaxed">{article.extract}</p>
                                )}
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag, tagIndex) => (
                                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </article>
                            </Link>
                            {index < news.length - 1 && <Separator className="mt-6" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                
                {/* Administrators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Administradores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {admins.length === 0 ? (
                      <div className="text-center py-6">
                        <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No hay administradores registrados.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {admins.map((admin) => (
                          <div key={admin.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="text-xs">ADMIN</Badge>
                              </div>
                              <p className="text-sm font-medium break-all">{admin.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

