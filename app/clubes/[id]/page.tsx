"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ChevronLeft, Mail, MapPin, Phone, Clock, Calendar, User, Heart, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSiteHeader } from "@/components/client-site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import {
  getClubById,
  getClubAdmins,
  getClubNews,
  isUserFollowingClub,
  followClub,
  unfollowClub,
  getClubFollowersCount,
  type Club,
  type ClubWithStats,
  type ClubAdmin,
  type ClubNews
} from "@/lib/clubUtils"
import { getCurrentUser } from "@/lib/userUtils"

interface ClubDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClubDetailPage({ params }: ClubDetailPageProps) {
  const resolvedParams = use(params)
  const [club, setClub] = useState<ClubWithStats | null>(null)
  const [admins, setAdmins] = useState<ClubAdmin[]>([])
  const [news, setNews] = useState<ClubNews[]>([])
  const [loading, setLoading] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clubId = parseInt(resolvedParams.id)

  useEffect(() => {
    if (!isNaN(clubId)) {
      loadClubData()
      loadCurrentUser()
    } else {
      setError("ID de club inválido")
      setLoading(false)
    }
  }, [clubId])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUserId(user.id) // Use the auth UUID directly
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadClubData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load club basic info with stats
      const clubData = await getClubById(clubId, true) as ClubWithStats | null
      if (!clubData) {
        setError("Club no encontrado")
        return
      }

      setClub(clubData)

      // Load additional data in parallel
      const [adminsData, newsData, followersCountData, isFollowingData] = await Promise.all([
        getClubAdmins(clubId),
        getClubNews(clubId, 5), // Limit to 5 most recent news
        getClubFollowersCount(clubId),
        currentUserId ? isUserFollowingClub(clubId, currentUserId) : false
      ])

      setAdmins(adminsData)
      setNews(newsData)
      setFollowersCount(followersCountData)
      setIsFollowing(isFollowingData)

    } catch (error) {
      console.error('Error loading club data:', error)
      setError("Error al cargar los datos del club")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!currentUserId || !club) return

    try {
      if (isFollowing) {
        await unfollowClub(club.id, currentUserId)
        setFollowersCount(prev => prev - 1)
      } else {
        await followClub(club.id, currentUserId)
        setFollowersCount(prev => prev + 1)
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error toggling follow status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <ClientSiteHeader pathname={`/clubes/${clubId}`} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-terracotta mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando información del club...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="flex min-h-screen flex-col">
        <ClientSiteHeader pathname={`/clubes/${clubId}`} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-terracotta mb-4">
              {error || "Club no encontrado"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || "El club que estás buscando no existe o ha sido eliminado."}
            </p>
            <Button asChild className="bg-terracotta hover:bg-terracotta/90 text-white">
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <Button asChild variant="outline" size="sm" className="mb-6 border-amber text-amber-dark hover:bg-amber/10">
              <Link href="/clubes">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a clubes
              </Link>
            </Button>

            <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-12">
              {/* Columna izquierda - Información principal */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-terracotta">{club.name}</h1>
                    <div className="mt-2 flex items-center gap-4">
                      <Badge variant="secondary">{club.adminCount} administradores</Badge>
                      <Badge variant="secondary">{club.newsCount} noticias</Badge>
                    </div>
                  </div>
                  {currentUserId && (
                    <Button
                      onClick={handleToggleFollow}
                      variant={isFollowing ? "default" : "outline"}
                      className={
                        isFollowing
                          ? "bg-terracotta hover:bg-terracotta/90 text-white"
                          : "border-terracotta text-terracotta hover:bg-terracotta/10"
                      }
                    >
                      <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Siguiendo" : "Seguir"}
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="informacion" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted border border-amber/20 mb-6">
                    <TabsTrigger
                      value="informacion"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Información
                    </TabsTrigger>
                    <TabsTrigger
                      value="noticias"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Noticias
                    </TabsTrigger>
                    <TabsTrigger
                      value="administradores"
                      className="data-[state=active]:bg-amber data-[state=active]:text-white"
                    >
                      Administradores
                    </TabsTrigger>
                  </TabsList>

                  {/* Pestaña de Información */}
                  <TabsContent value="informacion">
                    <Card className="border-amber/20">
                      <CardHeader>
                        <CardTitle className="text-terracotta">Información del Club</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {club.address && (
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Dirección</p>
                                <p className="text-sm text-muted-foreground">{club.address}</p>
                              </div>
                            </div>
                          )}
                          {club.telephone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-amber" />
                              <div>
                                <p className="text-sm font-medium">Teléfono</p>
                                <p className="text-sm text-muted-foreground">{club.telephone}</p>
                              </div>
                            </div>
                          )}
                          {club.mail && (
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-amber" />
                              <div>
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-sm text-muted-foreground">{club.mail}</p>
                              </div>
                            </div>
                          )}
                          {club.schedule && (
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-amber" />
                              <div>
                                <p className="text-sm font-medium">Horarios</p>
                                <p className="text-sm text-muted-foreground">{club.schedule}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Pestaña de Noticias */}
                  <TabsContent value="noticias">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-terracotta">Noticias del Club</h3>
                      {news.length === 0 ? (
                        <Card className="border-amber/20">
                          <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No hay noticias disponibles para este club.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        news.map((article) => (
                          <Card key={article.id} className="border-amber/20">
                            <CardContent className="p-6">
                              <div className="flex flex-col gap-4">
                                <div>
                                  <h4 className="text-lg font-bold text-terracotta">{article.title}</h4>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4 text-amber" />
                                      <span className="text-sm">{new Date(article.date).toLocaleDateString()}</span>
                                    </div>
                                    {article.author_name && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-amber" />
                                        <span className="text-sm">Por {article.author_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {article.extract && (
                                  <p className="text-muted-foreground">{article.extract}</p>
                                )}
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Pestaña de Administradores */}
                  <TabsContent value="administradores">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-terracotta">Administradores del Club</h3>
                      {admins.length === 0 ? (
                        <Card className="border-amber/20">
                          <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No hay administradores registrados para este club.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {admins.map((admin) => (
                            <Card key={admin.id} className="border-amber/20">
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-full bg-amber/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-amber" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-terracotta">
                                      <Badge className="mr-2 bg-amber text-white">ADMIN</Badge>
                                      {admin.email}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">ID: {admin.id.slice(0, 8)}...</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Columna derecha - Información de contacto */}
              <div className="space-y-6">
                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Información de contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {club.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Dirección</p>
                          <p className="text-sm text-muted-foreground">{club.address}</p>
                        </div>
                      </div>
                    )}
                    {club.telephone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-amber" />
                        <div>
                          <p className="text-sm font-medium">Teléfono</p>
                          <p className="text-sm text-muted-foreground">{club.telephone}</p>
                        </div>
                      </div>
                    )}
                    {club.mail && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-amber" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{club.mail}</p>
                        </div>
                      </div>
                    )}
                    {club.schedule && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber" />
                        <div>
                          <p className="text-sm font-medium">Horarios</p>
                          <p className="text-sm text-muted-foreground">{club.schedule}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-amber/20">
                  <CardHeader>
                    <CardTitle className="text-terracotta">Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Miembros</span>
                      <span className="text-2xl font-bold text-terracotta">{club.memberCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Administradores</span>
                      <span className="text-2xl font-bold text-terracotta">{club.adminCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Seguidores</span>
                      <span className="text-2xl font-bold text-terracotta">{followersCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Noticias</span>
                      <span className="text-2xl font-bold text-terracotta">{club.newsCount}</span>
                    </div>
                  </CardContent>
                </Card>

                {currentUserId && (
                  <Card className="border-amber/20">
                    <CardHeader>
                      <CardTitle className="text-terracotta">Seguir Club</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isFollowing ? "Estás siguiendo este club" : "Sigue este club para recibir actualizaciones"}
                        </span>
                        <Button
                          onClick={handleToggleFollow}
                          variant={isFollowing ? "default" : "outline"}
                          size="sm"
                          className={
                            isFollowing
                              ? "bg-terracotta hover:bg-terracotta/90 text-white"
                              : "border-terracotta text-terracotta hover:bg-terracotta/10"
                          }
                        >
                          <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                          {isFollowing ? "Siguiendo" : "Seguir"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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

