import { CalendarDays } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function HistoriaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Historia de FASGBA</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conoce la historia y evolución de la Federación de Ajedrez del Sur de Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-12 xl:grid-cols-[1fr_400px]">
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Nuestros Orígenes</h2>
                  <div className="mt-4 grid gap-6">
                    <p>
                      La Federación de Ajedrez del Sur de Buenos Aires (FASGBA) fue fundada el 15 de mayo de 1985 por un
                      grupo de entusiastas ajedrecistas de la región, con el objetivo de unificar y organizar la
                      actividad ajedrecística en el sur de la provincia de Buenos Aires.
                    </p>
                    <p>
                      En sus inicios, la federación contaba con apenas 5 clubes afiliados: Club de Ajedrez Bahía Blanca,
                      Círculo de Ajedrez Punta Alta, Club de Ajedrez Tres Arroyos, Círculo de Ajedrez Coronel Suárez y
                      Club de Ajedrez Monte Hermoso. Hoy, la federación cuenta con más de 15 clubes afiliados y organiza
                      decenas de torneos anuales.
                    </p>
                    <p>
                      El primer presidente de FASGBA fue el Dr. Roberto Fernández, reconocido ajedrecista y promotor
                      cultural de Bahía Blanca, quien sentó las bases organizativas que perduran hasta hoy.
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Hitos Importantes</h2>
                  <div className="mt-4 space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>1985</CardDescription>
                        </div>
                        <CardTitle>Fundación de FASGBA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          El 15 de mayo de 1985 se firma el acta fundacional de la Federación de Ajedrez del Sur de
                          Buenos Aires en la ciudad de Bahía Blanca.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>1990</CardDescription>
                        </div>
                        <CardTitle>Primer Campeonato Regional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Se organiza el primer Campeonato Regional con la participación de jugadores de todos los
                          clubes afiliados, coronando como campeón a Carlos Martínez del Club de Ajedrez Bahía Blanca.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>1995</CardDescription>
                        </div>
                        <CardTitle>Reconocimiento de la FADA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          La Federación Argentina de Ajedrez reconoce oficialmente a FASGBA como entidad regional,
                          permitiendo a sus jugadores participar en torneos nacionales.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>2005</CardDescription>
                        </div>
                        <CardTitle>Primer Gran Maestro</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Laura Martínez se convierte en la primera Gran Maestra de la región, marcando un hito en la
                          historia del ajedrez regional.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>2015</CardDescription>
                        </div>
                        <CardTitle>30° Aniversario</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          FASGBA celebra su 30° aniversario con un torneo internacional que contó con la participación
                          de jugadores de Argentina, Chile, Uruguay y Brasil.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <CardDescription>2020</CardDescription>
                        </div>
                        <CardTitle>Digitalización</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>
                          En respuesta a la pandemia, FASGBA implementa torneos online y digitaliza todos sus procesos
                          administrativos, modernizando la federación.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Presidentes Históricos</h2>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Dr. Roberto Fernández</CardTitle>
                        <CardDescription>1985 - 1995</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Presidente fundador que estableció las bases organizativas de la federación y promovió la
                          afiliación de nuevos clubes.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Ing. Miguel Sánchez</CardTitle>
                        <CardDescription>1995 - 2005</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Logró el reconocimiento oficial de la FADA y estableció el sistema de ranking regional que
                          sigue vigente.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Prof. Ana García</CardTitle>
                        <CardDescription>2005 - 2015</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Impulsó la formación de jóvenes talentos y la participación femenina en el ajedrez regional.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Lic. Carlos Martínez</CardTitle>
                        <CardDescription>2015 - Actualidad</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Modernizó la federación, implementó torneos online y expandió la presencia de FASGBA en
                          competencias nacionales e internacionales.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Tabs defaultValue="galeria" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="galeria">Galería</TabsTrigger>
                    <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
                  </TabsList>
                  <TabsContent value="galeria" className="mt-6 space-y-4">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="Fundación de FASGBA, 1985"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="bg-muted p-2 text-center text-sm">Fundación de FASGBA, 1985</div>
                    </div>
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="Primer Campeonato Regional, 1990"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="bg-muted p-2 text-center text-sm">Primer Campeonato Regional, 1990</div>
                    </div>
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="Celebración 30° Aniversario, 2015"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="bg-muted p-2 text-center text-sm">Celebración 30° Aniversario, 2015</div>
                    </div>
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="Sede actual de FASGBA"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="bg-muted p-2 text-center text-sm">Sede actual de FASGBA</div>
                    </div>
                  </TabsContent>
                  <TabsContent value="testimonios" className="mt-6 space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <blockquote className="border-l-2 pl-4 italic">
                          "Fundar FASGBA fue un sueño hecho realidad. Queríamos unir a todos los ajedrecistas de la
                          región y crear un espacio para que creciera el ajedrez en el sur de Buenos Aires."
                        </blockquote>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div>
                            <p className="text-sm font-medium">Dr. Roberto Fernández</p>
                            <p className="text-sm text-muted-foreground">Presidente Fundador</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <blockquote className="border-l-2 pl-4 italic">
                          "El ajedrez en nuestra región ha crecido enormemente gracias a FASGBA. Hoy tenemos jugadores
                          compitiendo a nivel internacional y una estructura sólida de torneos y formación."
                        </blockquote>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div>
                            <p className="text-sm font-medium">GM Laura Martínez</p>
                            <p className="text-sm text-muted-foreground">Primera Gran Maestra de la región</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <blockquote className="border-l-2 pl-4 italic">
                          "FASGBA ha sido fundamental para el desarrollo del ajedrez juvenil. Gracias a sus programas,
                          muchos jóvenes han encontrado en el ajedrez una pasión y un camino de crecimiento personal."
                        </blockquote>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div>
                            <p className="text-sm font-medium">Prof. Ana García</p>
                            <p className="text-sm text-muted-foreground">Ex-Presidenta (2005-2015)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                <Card>
                  <CardHeader>
                    <CardTitle>Línea de Tiempo</CardTitle>
                    <CardDescription>Eventos clave en la historia de FASGBA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            85
                          </div>
                          <div className="h-full w-px bg-border" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Fundación</h3>
                          <p className="text-sm text-muted-foreground">Creación de FASGBA en Bahía Blanca</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            90
                          </div>
                          <div className="h-full w-px bg-border" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Primer Campeonato</h3>
                          <p className="text-sm text-muted-foreground">Inicio de torneos regionales</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            95
                          </div>
                          <div className="h-full w-px bg-border" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Reconocimiento FADA</h3>
                          <p className="text-sm text-muted-foreground">Afiliación a la federación nacional</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            05
                          </div>
                          <div className="h-full w-px bg-border" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Primera GM</h3>
                          <p className="text-sm text-muted-foreground">Laura Martínez logra el título</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            15
                          </div>
                          <div className="h-full w-px bg-border" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">30° Aniversario</h3>
                          <p className="text-sm text-muted-foreground">Torneo internacional conmemorativo</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-sm font-medium">
                            20
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Digitalización</h3>
                          <p className="text-sm text-muted-foreground">Modernización de la federación</p>
                        </div>
                      </div>
                    </div>
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

