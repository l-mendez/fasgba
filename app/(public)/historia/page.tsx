import { CalendarDays, Quote } from "lucide-react"
import type { Metadata } from 'next'

import { PageHero } from "@/components/page-hero"

// Hardcoded content — prerender once, never revalidate.
export const revalidate = false

export const metadata: Metadata = {
  title: 'Historia',
  description: 'Conoce la historia y evolución de la Federación de Ajedrez del Sur del Gran Buenos Aires desde 1975',
}

const hitos = [
  {
    anio: "1975",
    titulo: "Fundación de FASGBA",
    texto:
      "El 15 de mayo de 1975 se firma el acta fundacional de la Federación de Ajedrez del Sur de Buenos Aires en la ciudad de Bahía Blanca.",
  },
  {
    anio: "1990",
    titulo: "Primer Campeonato Regional",
    texto:
      "Se organiza el primer Campeonato Regional con la participación de jugadores de todos los clubes afiliados, coronando como campeón a Carlos Martínez del Club de Ajedrez Bahía Blanca.",
  },
  {
    anio: "1995",
    titulo: "Reconocimiento de la FADA",
    texto:
      "La Federación de Ajedrez reconoce oficialmente a FASGBA como entidad regional, permitiendo a sus jugadores participar en torneos nacionales.",
  },
  {
    anio: "2005",
    titulo: "Primer Gran Maestro",
    texto:
      "Laura Martínez se convierte en la primera Gran Maestra de la región, marcando un hito en la historia del ajedrez regional.",
  },
  {
    anio: "2015",
    titulo: "30° Aniversario",
    texto:
      "FASGBA celebra su 30° aniversario con un torneo internacional que contó con la participación de jugadores de Argentina, Chile, Uruguay y Brasil.",
  },
  {
    anio: "2020",
    titulo: "Digitalización",
    texto:
      "En respuesta a la pandemia, FASGBA implementa torneos online y digitaliza todos sus procesos administrativos, modernizando la federación.",
  },
]

const presidentes = [
  {
    nombre: "Dr. Roberto Fernández",
    periodo: "1975 - 1995",
    texto: "Presidente fundador que estableció las bases organizativas de la federación y promovió la afiliación de nuevos clubes.",
  },
  {
    nombre: "Ing. Miguel Sánchez",
    periodo: "1995 - 2005",
    texto: "Logró el reconocimiento oficial de la FADA y estableció el sistema de ranking regional que sigue vigente.",
  },
  {
    nombre: "Prof. Ana García",
    periodo: "2005 - 2015",
    texto: "Impulsó la formación de jóvenes talentos y la participación femenina en el ajedrez regional.",
  },
  {
    nombre: "Lic. Carlos Martínez",
    periodo: "2015 - Actualidad",
    texto:
      "Modernizó la federación, implementó torneos online y expandió la presencia de FASGBA en competencias nacionales e internacionales.",
  },
]

const testimonios = [
  {
    autor: "Dr. Roberto Fernández",
    rol: "Presidente Fundador",
    texto:
      "Fundar FASGBA fue un sueño hecho realidad. Queríamos unir a todos los ajedrecistas de la región y crear un espacio para que creciera el ajedrez en el sur de Buenos Aires.",
  },
  {
    autor: "GM Laura Martínez",
    rol: "Primera Gran Maestra de la región",
    texto:
      "El ajedrez en nuestra región ha crecido enormemente gracias a FASGBA. Hoy tenemos jugadores compitiendo a nivel internacional y una estructura sólida de torneos y formación.",
  },
  {
    autor: "Prof. Ana García",
    rol: "Ex-Presidenta (2005-2015)",
    texto:
      "FASGBA ha sido fundamental para el desarrollo del ajedrez juvenil. Gracias a sus programas, muchos jóvenes han encontrado en el ajedrez una pasión y un camino de crecimiento personal.",
  },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">{children}</h2>
}

export default function HistoriaPage() {
  return (
    <>
      <PageHero title="Historia" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container grid gap-10 px-4 md:px-6 lg:grid-cols-[1fr_340px] lg:gap-12">
          <div className="space-y-10">
            <div>
              <SectionTitle>Nuestros Orígenes</SectionTitle>
              <div className="space-y-4 leading-relaxed">
                <p>
                  La Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA) fue fundada el 15 de mayo de 1975 por un
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
              <SectionTitle>Hitos Importantes</SectionTitle>
              <ol className="space-y-3">
                {hitos.map((hito) => (
                  <li key={hito.anio} className="rounded-lg border bg-card p-4">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {hito.anio}
                    </p>
                    <h3 className="mt-1 font-semibold">{hito.titulo}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{hito.texto}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <SectionTitle>Presidentes Históricos</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {presidentes.map((presidente) => (
                  <div key={presidente.nombre} className="h-full rounded-lg border bg-card p-4">
                    <h3 className="font-semibold">{presidente.nombre}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {presidente.periodo}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{presidente.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <SectionTitle>Testimonios</SectionTitle>
            <div className="space-y-3">
              {testimonios.map((testimonio) => (
                <figure key={testimonio.autor} className="rounded-lg border bg-card p-4">
                  <Quote className="h-4 w-4 text-amber" />
                  <blockquote className="mt-2 text-sm italic">{testimonio.texto}</blockquote>
                  <figcaption className="mt-3 text-sm">
                    <span className="font-medium">{testimonio.autor}</span>
                    <span className="block text-muted-foreground">{testimonio.rol}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
