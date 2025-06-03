import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getClubsWithFollowStatus, type ClubWithFollowState } from "@/lib/clubUtils"
import { getCurrentUserServer } from "@/lib/auth-server"
import { ClubFollowButton } from "@/components/club-follow-button"
import { ClubSearch } from "@/components/club-search"

interface PageProps {
  searchParams: Promise<{ search?: string }>
}

async function ClubsList({ searchTerm }: { searchTerm?: string }) {
  const user = await getCurrentUserServer()
  const clubs = await getClubsWithFollowStatus(user?.id || null, searchTerm)

  if (clubs.length === 0) {
    return (
      <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {searchTerm ? "No se encontraron clubes" : "No hay clubes disponibles"}
        </h3>
        <p className="text-muted-foreground">
          {searchTerm ? "Intenta con otros términos de búsqueda." : "Vuelve más tarde para ver los clubes afiliados."}
        </p>
        {searchTerm && (
          <Button asChild variant="outline" className="mt-4 mx-auto">
            <Link href="/clubes">Ver todos los clubes</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
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
                {/* Member count removed as it's no longer used */}
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
            <ClubFollowButton 
              clubId={club.id} 
              initialIsFollowing={club.isFollowing} 
              isUserAuthenticated={!!user}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default async function ClubesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const searchTerm = resolvedSearchParams.search

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
                <Suspense fallback={<div className="w-full md:w-1/3 h-10 bg-muted animate-pulse rounded" />}>
                  <ClubSearch />
                </Suspense>
              </div>
            </div>

            <ClubsList searchTerm={searchTerm} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

