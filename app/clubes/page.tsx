"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mail, MapPin, Phone, Heart, Search, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import { 
  getAllClubs, 
  searchClubsByName, 
  isUserFollowingClub, 
  followClub, 
  unfollowClub,
  getClubMemberCount,
  type Club 
} from "@/lib/clubUtils"
import { getCurrentUser } from "@/lib/userUtils"

interface ClubWithFollowState extends Club {
  isFollowing: boolean
  memberCount: number
}

export default function ClubesPage() {
  const [clubs, setClubs] = useState<ClubWithFollowState[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    loadClubs()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        // Convert auth user ID to database user ID - you may need to adjust this
        // depending on how you link auth users to database users
        setCurrentUserId(1) // Placeholder - you'll need proper user ID mapping
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadClubs = async () => {
    try {
      setLoading(true)
      const clubsData = await getAllClubs()
      
      // Load additional data for each club
      const clubsWithExtraData = await Promise.all(
        clubsData.map(async (club) => {
          const [memberCount, isFollowing] = await Promise.all([
            getClubMemberCount(club.id),
            currentUserId ? isUserFollowingClub(club.id, currentUserId) : false
          ])
          
          return {
            ...club,
            memberCount,
            isFollowing
          }
        })
      )
      
      setClubs(clubsWithExtraData)
    } catch (error) {
      console.error('Error loading clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.trim() === "") {
      loadClubs()
      return
    }

    try {
      setLoading(true)
      const searchResults = await searchClubsByName(term)
      
      const clubsWithExtraData = await Promise.all(
        searchResults.map(async (club) => {
          const [memberCount, isFollowing] = await Promise.all([
            getClubMemberCount(club.id),
            currentUserId ? isUserFollowingClub(club.id, currentUserId) : false
          ])
          
          return {
            ...club,
            memberCount,
            isFollowing
          }
        })
      )
      
      setClubs(clubsWithExtraData)
    } catch (error) {
      console.error('Error searching clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFollow = async (clubId: number) => {
    if (!currentUserId) return

    const club = clubs.find(c => c.id === clubId)
    if (!club) return

    try {
      if (club.isFollowing) {
        await unfollowClub(clubId, currentUserId)
      } else {
        await followClub(clubId, currentUserId)
      }

      // Update local state
      setClubs(clubs.map(c => 
        c.id === clubId 
          ? { ...c, isFollowing: !c.isFollowing }
          : c
      ))
    } catch (error) {
      console.error('Error toggling follow status:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Clubes Afiliados</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conoce los clubes que forman parte de la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Directorio de Clubes</h2>
                  <p className="text-muted-foreground">
                    Encuentra información detallada sobre cada club afiliado a FASGBA
                  </p>
                </div>
                <div className="w-full md:w-1/3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Buscar club..." 
                      className="w-full pl-10" 
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
                <span className="ml-2 text-muted-foreground">Cargando clubes...</span>
              </div>
            ) : clubs.length === 0 ? (
              <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  {searchTerm ? "No se encontraron clubes" : "No hay clubes disponibles"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Intenta con otros términos de búsqueda." : "Vuelve más tarde para ver los clubes afiliados."}
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => handleSearch("")} 
                    variant="outline" 
                    className="mt-4 mx-auto"
                  >
                    Ver todos los clubes
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[400px] transition-opacity duration-200">
                {clubs.map((club) => (
                  <Card key={club.id} className="flex flex-col group hover:border-amber transition-colors">
                    <CardHeader>
                      <CardTitle>
                        <Link href={`/clubes/${club.id}`} className="text-terracotta hover:underline">
                          {club.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {club.memberCount} miembros
                          </Badge>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-4">
                        {club.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-sm">{club.address}</span>
                          </div>
                        )}
                        {club.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-sm">{club.telephone}</span>
                          </div>
                        )}
                        {club.mail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-sm">{club.mail}</span>
                          </div>
                        )}
                        {club.schedule && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Horarios de actividad:</h4>
                            <p className="text-sm text-muted-foreground">{club.schedule}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button asChild className="w-full">
                        <Link href={`/clubes/${club.id}`}>Ver Detalle</Link>
                      </Button>
                      {currentUserId && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`border-amber text-amber-dark hover:bg-amber/10 ${
                            club.isFollowing ? 'bg-amber/10' : ''
                          }`}
                          onClick={() => handleToggleFollow(club.id)}
                        >
                          <Heart className={`h-4 w-4 ${club.isFollowing ? 'fill-current' : ''}`} />
                          <span className="sr-only">
                            {club.isFollowing ? 'Dejar de seguir' : 'Seguir'} club
                          </span>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

