import Link from "next/link"
import { Calendar, ChevronLeft, MapPin, Medal, Trophy, User, Edit, CastleIcon } from "lucide-react"

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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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

export default function PerfilPage() {
  // Mock user data
  const user = {
    id: "1",
    name: "Juan",
    surname: "Pérez",
    birth_date: "1990-05-15",
    birth_gender: "M",
    email: "juan.perez@example.com",
    profile_picture: "/avatars/01.png",
    biography: "Jugador de ajedrez desde los 8 años. Campeón nacional juvenil en 2010.",
    club_id: "1",
    club: {
      id: "1",
      name: "Club de Ajedrez Buenos Aires"
    },
    page_admin: false,
    elo: 1850,
    eloHistory: [
      { id: "1", user_id: "1", elo: 1850, recorded_at: "2023-12-15T10:30:00Z" },
      { id: "2", user_id: "1", elo: 1820, recorded_at: "2023-11-10T14:45:00Z" },
      { id: "3", user_id: "1", elo: 1780, recorded_at: "2023-10-05T09:15:00Z" },
      { id: "4", user_id: "1", elo: 1750, recorded_at: "2023-09-20T16:20:00Z" },
      { id: "5", user_id: "1", elo: 1720, recorded_at: "2023-08-12T11:30:00Z" }
    ]
  };

  // Mock tournaments data
  const tournaments = [
    {
      id: "1",
      name: "Torneo Nacional 2023",
      start_date: "2023-12-01",
      end_date: "2023-12-10",
      place: "Buenos Aires",
      position: 3,
      score: 6.5,
      total_players: 32
    },
    {
      id: "2",
      name: "Torneo Metropolitano",
      start_date: "2023-10-15",
      end_date: "2023-10-22",
      place: "La Plata",
      position: 1,
      score: 7.0,
      total_players: 24
    },
    {
      id: "3",
      name: "Torneo Provincial",
      start_date: "2023-08-05",
      end_date: "2023-08-12",
      place: "Mar del Plata",
      position: 2,
      score: 6.0,
      total_players: 18
    }
  ];

  // Mock achievements data
  const achievements = [
    {
      id: "1",
      title: "Campeón Metropolitano 2023",
      description: "Primer lugar en el Torneo Metropolitano de Ajedrez",
      date: "2023-10-22",
      icon: "trophy"
    },
    {
      id: "2",
      title: "ELO 1800+",
      description: "Alcanzó un ELO de 1800 puntos",
      date: "2023-11-15",
      icon: "medal"
    },
    {
      id: "3",
      title: "10 Torneos Completados",
      description: "Participó en 10 torneos oficiales",
      date: "2023-09-30",
      icon: "trophy"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
          
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {/* Profile Header */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.profile_picture} alt={`${user.name} ${user.surname}`} />
                        <AvatarFallback>{user.name.charAt(0)}{user.surname.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">{user.name} {user.surname}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {user.club.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar perfil
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">ELO</p>
                      <p className="text-2xl font-bold text-terracotta">{user.elo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Edad</p>
                      <p className="text-2xl font-bold">{calculateAge(user.birth_date)} años</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-2xl font-bold">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fecha de nacimiento</p>
                      <p className="text-2xl font-bold">{formatDate(user.birth_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="tournaments" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tournaments">Torneos</TabsTrigger>
                  <TabsTrigger value="achievements">Logros</TabsTrigger>
                  <TabsTrigger value="elo">ELO</TabsTrigger>
                </TabsList>
                
                {/* Tournaments Tab */}
                <TabsContent value="tournaments" className="space-y-4">
                  {tournaments.map((tournament) => (
                    <Card key={tournament.id}>
                      <CardHeader>
                        <CardTitle>{tournament.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-sm font-medium">Posición</p>
                            <p className="text-xl font-bold">{tournament.position}° de {tournament.total_players}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Puntuación</p>
                            <p className="text-xl font-bold">{tournament.score}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Lugar</p>
                            <p className="text-xl font-bold">{tournament.place}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                
                {/* Achievements Tab */}
                <TabsContent value="achievements" className="space-y-4">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id}>
                      <CardHeader>
                        <div className="flex items-center">
                          {achievement.icon === "trophy" ? (
                            <Trophy className="mr-2 h-5 w-5 text-amber" />
                          ) : (
                            <Medal className="mr-2 h-5 w-5 text-amber" />
                          )}
                          <CardTitle>{achievement.title}</CardTitle>
                        </div>
                        <CardDescription>{formatDate(achievement.date)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{achievement.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                
                {/* ELO Tab */}
                <TabsContent value="elo" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de ELO</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <div className="relative h-full w-full">
                          {/* Y-axis labels */}
                          <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-muted-foreground">
                            <span>2000</span>
                            <span>1900</span>
                            <span>1800</span>
                            <span>1700</span>
                            <span>1600</span>
                          </div>
                          
                          {/* Chart area */}
                          <div className="absolute left-8 right-0 top-0 h-full">
                            {/* Grid lines */}
                            <div className="absolute inset-0 grid grid-rows-4">
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                              <div className="border-b border-dashed border-muted-foreground/20"></div>
                            </div>
                            
                            {/* Data points and line */}
                            <div className="relative h-full overflow-hidden">
                              {/* Line connecting points */}
                              <svg className="absolute inset-0 h-full w-full">
                                <polyline
                                  points={user.eloHistory
                                    .map((record, index) => {
                                      const x = (index / (user.eloHistory.length - 1)) * 100;
                                      const y = 100 - ((record.elo - 1600) / 400) * 100;
                                      return `${x}%,${y}%`;
                                    })
                                    .join(' ')}
                                  fill="none"
                                  stroke="hsl(var(--terracotta))"
                                  strokeWidth="2"
                                />
                              </svg>
                              
                              {/* Data points */}
                              {user.eloHistory.map((record, index) => {
                                const x = (index / (user.eloHistory.length - 1)) * 100;
                                // Ensure y is within bounds (0-100%)
                                const y = Math.min(100, Math.max(0, 100 - ((record.elo - 1600) / 400) * 100));
                                return (
                                  <div
                                    key={record.id}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                  >
                                    <div className="h-3 w-3 rounded-full bg-terracotta"></div>
                                    <div className="mt-1 text-xs font-medium">{record.elo}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(record.recorded_at)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Biografía</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{user.biography}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Club</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CastleIcon className="h-5 w-5 text-terracotta" />
                    <span className="font-medium">{user.club.name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

