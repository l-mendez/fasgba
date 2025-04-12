import Link from "next/link"
import { BookOpen, Download, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

// Datos de ejemplo para los reglamentos
const reglamentos = [
  {
    id: "leyes-ajedrez",
    titulo: "Leyes del Ajedrez FIDE",
    descripcion: "Reglamento oficial que rige todas las partidas de ajedrez.",
    actualizacion: "1 de enero de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "2.4 MB",
  },
  {
    id: "reglamento-competicion",
    titulo: "Reglamento de Competición",
    descripcion: "Normas para la organización de torneos oficiales.",
    actualizacion: "15 de marzo de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "1.8 MB",
  },
  {
    id: "normas-titulos",
    titulo: "Normas para Títulos Internacionales",
    descripcion: "Requisitos para la obtención de títulos FIDE.",
    actualizacion: "1 de julio de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "1.2 MB",
  },
  {
    id: "reglamento-antitrampa",
    titulo: "Reglamento Antitrampa",
    descripcion: "Medidas para prevenir y sancionar el uso de asistencia externa.",
    actualizacion: "1 de enero de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "1.5 MB",
  },
  {
    id: "reglamento-arbitros",
    titulo: "Reglamento para Árbitros",
    descripcion: "Normas y procedimientos para árbitros oficiales.",
    actualizacion: "1 de abril de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "2.1 MB",
  },
  {
    id: "sistema-suizo",
    titulo: "Reglas del Sistema Suizo",
    descripcion: "Procedimientos oficiales para emparejamientos en sistema suizo.",
    actualizacion: "1 de enero de 2023",
    idioma: "Español",
    formato: "PDF",
    tamaño: "1.3 MB",
  },
]

// Datos de ejemplo para los reglamentos FASGBA
const reglamentosFASGBA = [
  {
    id: "reglamento-torneos-fasgba",
    titulo: "Reglamento de Torneos FASGBA",
    descripcion: "Normas específicas para torneos organizados por la federación.",
    actualizacion: "15 de febrero de 2024",
    idioma: "Español",
    formato: "PDF",
    tamaño: "1.1 MB",
  },
  {
    id: "reglamento-equipos",
    titulo: "Reglamento de Torneos por Equipos",
    descripcion: "Normas para competiciones entre clubes afiliados.",
    actualizacion: "1 de marzo de 2024",
    idioma: "Español",
    formato: "PDF",
    tamaño: "0.9 MB",
  },
  {
    id: "reglamento-apelaciones",
    titulo: "Reglamento del Comité de Apelaciones",
    descripcion: "Procedimientos para presentar y resolver apelaciones.",
    actualizacion: "10 de enero de 2024",
    idioma: "Español",
    formato: "PDF",
    tamaño: "0.7 MB",
  },
  {
    id: "codigo-etica",
    titulo: "Código de Ética FASGBA",
    descripcion: "Normas de conducta para jugadores, árbitros y organizadores.",
    actualizacion: "1 de enero de 2024",
    idioma: "Español",
    formato: "PDF",
    tamaño: "0.8 MB",
  },
]

export default function ReglamentosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Reglamentos</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Consulta los reglamentos oficiales de la FIDE y FASGBA
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <Tabs defaultValue="fide" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="fide">Reglamentos FIDE</TabsTrigger>
                <TabsTrigger value="fasgba">Reglamentos FASGBA</TabsTrigger>
              </TabsList>
              <TabsContent value="fide" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {reglamentos.map((reglamento) => (
                    <Card key={reglamento.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {reglamento.titulo}
                        </CardTitle>
                        <CardDescription>{reglamento.descripcion}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actualización:</span>
                            <span>{reglamento.actualizacion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Idioma:</span>
                            <span>{reglamento.idioma}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Formato:</span>
                            <span>{reglamento.formato}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tamaño:</span>
                            <span>{reglamento.tamaño}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/reglamentos/fide/${reglamento.id}`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href={`/reglamentos/fide/${reglamento.id}/download`}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="fasgba" className="mt-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {reglamentosFASGBA.map((reglamento) => (
                    <Card key={reglamento.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {reglamento.titulo}
                        </CardTitle>
                        <CardDescription>{reglamento.descripcion}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actualización:</span>
                            <span>{reglamento.actualizacion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Idioma:</span>
                            <span>{reglamento.idioma}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Formato:</span>
                            <span>{reglamento.formato}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tamaño:</span>
                            <span>{reglamento.tamaño}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/reglamentos/fasgba/${reglamento.id}`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href={`/reglamentos/fasgba/${reglamento.id}/download`}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

