import { BarChart3, Calendar, FileText, Home, MessageSquare, TrendingUp, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminEstadisticasPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-terracotta">Estadísticas</h1>
        <p className="text-muted-foreground">Visualiza las métricas y estadísticas del sitio web.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="torneos">Torneos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber/10 p-1.5 text-amber-dark">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,231</div>
                <p className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +12.5%
                  </span>
                  <span className="ml-1">desde el mes pasado</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber/10 p-1.5 text-amber-dark">
                  <Users className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +8.3%
                  </span>
                  <span className="ml-1">desde el mes pasado</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clubes Afiliados</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber/10 p-1.5 text-amber-dark">
                  <Home className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +2
                  </span>
                  <span className="ml-1">desde el mes pasado</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Torneos Activos</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber/10 p-1.5 text-amber-dark">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +3
                  </span>
                  <span className="ml-1">desde el mes pasado</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Visitas al sitio</CardTitle>
                <CardDescription>Visitas diarias durante los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <span>Gráfico de visitas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Páginas más visitadas</CardTitle>
                <CardDescription>Las páginas con mayor número de visitas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Página principal</span>
                    </div>
                    <span className="text-sm">12,345 visitas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Torneos</span>
                    </div>
                    <span className="text-sm">8,765 visitas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Ranking</span>
                    </div>
                    <span className="text-sm">6,543 visitas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Clubes</span>
                    </div>
                    <span className="text-sm">5,432 visitas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Noticias</span>
                    </div>
                    <span className="text-sm">4,321 visitas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por rol</CardTitle>
                <CardDescription>Usuarios registrados según su rol en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <span>Gráfico de distribución</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nuevos registros</CardTitle>
                <CardDescription>Usuarios registrados en los últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <span>Gráfico de registros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad de usuarios</CardTitle>
                <CardDescription>Usuarios más activos en el último mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber-dark">
                        CM
                      </div>
                      <span className="text-sm font-medium">Carlos Martínez</span>
                    </div>
                    <span className="text-sm">45 acciones</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber-dark">
                        LG
                      </div>
                      <span className="text-sm font-medium">Laura Gómez</span>
                    </div>
                    <span className="text-sm">38 acciones</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber-dark">
                        RS
                      </div>
                      <span className="text-sm font-medium">Roberto Sánchez</span>
                    </div>
                    <span className="text-sm">32 acciones</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber-dark">
                        ML
                      </div>
                      <span className="text-sm font-medium">María López</span>
                    </div>
                    <span className="text-sm">29 acciones</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center text-amber-dark">
                        JP
                      </div>
                      <span className="text-sm font-medium">Juan Pérez</span>
                    </div>
                    <span className="text-sm">24 acciones</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contenido" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Noticias publicadas</CardTitle>
                <CardDescription>Noticias publicadas por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <span>Gráfico de noticias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comentarios</CardTitle>
                <CardDescription>Comentarios por categoría de contenido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-8 w-8" />
                    <span>Gráfico de comentarios</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contenido más comentado</CardTitle>
                <CardDescription>Publicaciones con mayor interacción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        Bahía Blanca suma una nueva entidad al ajedrez federado regional
                      </span>
                    </div>
                    <span className="text-sm">24 comentarios</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        Ajedrez por la memoria verdad y justicia
                      </span>
                    </div>
                    <span className="text-sm">18 comentarios</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium truncate max-w-[200px]">Gran Prix FASGBA 2025</span>
                    </div>
                    <span className="text-sm">15 comentarios</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        FASGBA y AFA consolidan su trabajo conjunto con nuevos proyectos para 2025
                      </span>
                    </div>
                    <span className="text-sm">12 comentarios</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium truncate max-w-[200px]">Torneo Rápido de Mayo</span>
                    </div>
                    <span className="text-sm">10 comentarios</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="torneos" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Torneos por mes</CardTitle>
                <CardDescription>Cantidad de torneos organizados por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-8 w-8" />
                    <span>Gráfico de torneos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inscripciones</CardTitle>
                <CardDescription>Inscripciones a torneos por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md border border-dashed flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <span>Gráfico de inscripciones</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Torneos más populares</CardTitle>
                <CardDescription>Torneos con mayor número de inscripciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Gran Prix FASGBA 2025</span>
                    </div>
                    <span className="text-sm">78 inscriptos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Campeonato Regional Individual</span>
                    </div>
                    <span className="text-sm">65 inscriptos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Torneo Rápido de Mayo</span>
                    </div>
                    <span className="text-sm">52 inscriptos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Campeonato Regional por Equipos</span>
                    </div>
                    <span className="text-sm">48 inscriptos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber" />
                      <span className="text-sm font-medium">Torneo Escolar FASGBA</span>
                    </div>
                    <span className="text-sm">45 inscriptos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

