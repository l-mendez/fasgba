import Link from "next/link"
import { Calendar, ChevronLeft, MapPin, Medal, Trophy, User, Edit } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Format date to a readable string
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Calculate age from birth date
function calculateAge(birthDateString: string) {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export default async function PerfilPage() {
  // Initialize Supabase client
  const supabase = createServerComponentClient<Database>({ 
    cookies
  })

  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
      redirect('/login');
    }

    // Redirect to login if not authenticated
    if (!session) {
      redirect('/login');
    }

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        surname,
        birth_date,
        birth_gender,
        email,
        profile_picture,
        biography,
        club_id,
        club:clubs!club_id(id, name),
        page_admin
      `)
      .eq('auth_id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError.message);
      return <div>Error loading profile</div>;
    }

    // Fetch ELO history
    const { data: eloData, error: eloError } = await supabase
      .from('elohistory')
      .select('id, user_id, elo, recorded_at')
      .eq('user_id', userData?.id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (eloError) {
      console.error('Error fetching ELO history:', eloError.message);
    }

    // Prepare user data for display
    const user = {
      ...userData,
      elo: eloData && eloData.length > 0 ? eloData[0].elo : 1500,
      eloHistory: eloData || [],
      age: calculateAge(userData.birth_date),
      fullName: `${userData.name} ${userData.surname}`,
      club: userData.club as { id: number; name: string } | null
    };

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
                {/* Columna izquierda - Información del perfil */}
                <div className="space-y-6">
                  <Card className="border-amber/20">
                    <CardHeader className="pb-2 flex flex-col items-center text-center">
                      <div className="relative mb-2">
                        <Avatar className="h-24 w-24 border-2 border-amber">
                          <AvatarImage src={user.profile_picture || "/placeholder.svg?height=200&width=200"} alt={user.fullName} />
                          <AvatarFallback className="bg-amber/10 text-amber-dark text-2xl">
                            {user.name.charAt(0)}{user.surname.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-amber bg-background text-amber-dark hover:bg-amber/10"
                          asChild
                        >
                          <Link href="/configuracion">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar perfil</span>
                          </Link>
                        </Button>
                      </div>
                      <CardTitle className="text-2xl text-terracotta">
                        {user.fullName}
                      </CardTitle>
                      <CardDescription>
                        {user.club?.name ?? "Sin club"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="inline-flex items-center justify-center rounded-full bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
                        ELO: {user.elo}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{user.biography || "Sin biografía"}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-amber/20">
                    <CardHeader>
                      <CardTitle className="text-terracotta">Información personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-amber" />
                        <div>
                          <p className="text-sm font-medium">Edad</p>
                          <p className="text-sm text-muted-foreground">{user.age} años</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-amber" />
                        <div>
                          <p className="text-sm font-medium">Fecha de nacimiento</p>
                          <p className="text-sm text-muted-foreground">{formatDate(user.birth_date)}</p>
                        </div>
                      </div>
                      {user.club && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-amber" />
                          <div>
                            <p className="text-sm font-medium">Club</p>
                            <p className="text-sm text-muted-foreground">
                              <Link 
                                href={`/clubes/${user.club.id}`}
                                className="text-amber-dark hover:underline"
                              >
                                {user.club.name}
                              </Link>
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full border-amber text-amber-dark hover:bg-amber/10">
                        <Link href="/configuracion">Editar información</Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* ELO History Card */}
                  {user.eloHistory.length > 0 && (
                    <Card className="border-amber/20">
                      <CardHeader>
                        <CardTitle className="text-terracotta">Historial de ELO</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {user.eloHistory.map((entry, idx) => {
                            const prevElo = idx < user.eloHistory.length - 1 ? user.eloHistory[idx + 1].elo : entry.elo;
                            const change = entry.elo - prevElo;
                            return (
                              <div key={entry.id} className="flex items-center justify-between text-sm">
                                <span>{formatDate(entry.recorded_at)}</span>
                                <div className="flex items-center gap-2">
                                  <span>{entry.elo}</span>
                                  {change !== 0 && (
                                    <span className={change > 0 ? "text-green-500" : "text-red-500"}>
                                      {change > 0 ? `+${change}` : change}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Columna derecha - Pestañas con más información */}
                <div>
                  <Tabs defaultValue="actividad" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="actividad">Actividad reciente</TabsTrigger>
                      <TabsTrigger value="partidas">Partidas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="actividad" className="space-y-4 pt-4">
                      <Card className="border-amber/20">
                        <CardHeader>
                          <CardTitle className="text-terracotta">Actividad reciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">No hay actividad reciente para mostrar.</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="partidas" className="space-y-4 pt-4">
                      <Card className="border-amber/20">
                        <CardHeader>
                          <CardTitle className="text-terracotta">Partidas recientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">No hay partidas recientes para mostrar.</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  } catch (error) {
    console.error('Error in PerfilPage:', error);
    return <div>Error loading profile</div>;
  }
}

