import Link from "next/link"
import { Calendar, MapPin, ArrowRight, Trophy, Users, Newspaper, HelpCircle } from "lucide-react"
import { ReactNode } from "react"
import { createClient } from '@supabase/supabase-js'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroAurora } from "@/components/hero-aurora"
import { ClubMarquee } from "@/components/club-marquee"
import { FaqAccordion } from "@/components/faq-section"
import { getAllNews } from "@/lib/newsUtils"
import { getAllTournamentsWithDates, transformTournamentToDisplay } from "@/lib/tournamentUtils"
import { getAllClubs } from "@/lib/clubUtils"
import { getImageUrl } from "@/lib/imageUtils"

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types
interface NewsItem {
  id: number
  title: string
  date: string
  image: string | null
  extract: string
  tags: string[]
  club_id: number | null
  club: { id: number; name: string } | null
}

interface Tournament {
  id: number
  title: string
  description: string | null
  time: string | null
  place: string | null
  location: string | null
  rounds: number | null
  pace: string | null
  inscription_details: string | null
  cost: string | null
  prizes: string | null
  image: string | null
  created_by_club_id?: number | null
  formatted_start_date?: string
  isOngoing?: boolean
}

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  image: string | null
}

interface Noticia {
  id: string
  titulo: string
  fecha: string
  imagen: string
  categorias: string[]
  extracto: string
  destacada?: boolean
}

// Data fetching
async function fetchNews(): Promise<NewsItem[]> {
  try {
    const { data } = await getAllNews({ limit: 20, include: ['club', 'author'] })
    const mapped = data.map(item => ({
      id: item.id, title: item.title, date: item.date,
      image: item.image, extract: item.extract || '', tags: item.tags || [],
      club_id: item.club_id,
      club: item.club ? { id: item.club.id, name: item.club.name } : null
    }))
    return mapped.sort((a, b) => {
      if (a.club_id === null && b.club_id !== null) return -1
      if (a.club_id !== null && b.club_id === null) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }).slice(0, 5)
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

async function fetchTournaments(): Promise<Tournament[]> {
  try {
    const all = await getAllTournamentsWithDates(supabase)
    const display = all.map(transformTournamentToDisplay)
    const ongoing = display.filter(t => t.is_ongoing).map(t => ({
      ...t, formatted_start_date: t.formatted_start_date, isOngoing: true,
    }))
    const upcoming = display.filter(t => t.is_upcoming).slice(0, 3).map(t => ({
      ...t, formatted_start_date: t.formatted_start_date, isOngoing: false,
    }))
    return [...ongoing, ...upcoming].slice(0, 6)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return []
  }
}

async function fetchClubs(): Promise<Club[]> {
  try {
    const clubs = await getAllClubs()
    return (clubs as Club[]).slice(0, 12)
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return []
  }
}

function mapNewsToNoticia(item: NewsItem, featured = false): Noticia {
  const date = new Date(item.date)
  return {
    id: item.id.toString(),
    titulo: item.title,
    fecha: date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    imagen: getImageUrl(item.image),
    categorias: item.tags,
    extracto: item.extract || item.title,
    destacada: featured,
  }
}

function formatTournamentDate(t: Tournament): string {
  return t.formatted_start_date || 'Fecha por confirmar'
}

// --- Components ---

function NoticiaDestacada({ noticia }: { noticia: Noticia }): ReactNode {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <img src={noticia.imagen || "/placeholder.svg"} alt={noticia.titulo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 text-white">
        <div className="mb-3 flex flex-wrap gap-2">
          {noticia.categorias.slice(0, 3).map(cat => (
            <Badge key={cat} variant="outline" className="border-amber/50 bg-amber/10 text-amber-light backdrop-blur-sm text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{noticia.titulo}</h2>
        <p className="mb-3 text-sm text-white/70 line-clamp-2 max-w-xl">{noticia.extracto}</p>
        <div className="flex items-center gap-2 text-sm text-amber-light">
          <Calendar className="h-4 w-4" />
          <span>{noticia.fecha}</span>
        </div>
      </div>
    </div>
  )
}

function NoticiaCard({ noticia }: { noticia: Noticia }): ReactNode {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <img src={noticia.imagen || "/placeholder.svg"} alt={noticia.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-5 text-white">
        <div className="mb-2 flex flex-wrap gap-1">
          {noticia.categorias.slice(0, 2).map(cat => (
            <Badge key={cat} variant="outline" className="border-amber/40 bg-amber/10 text-amber-light backdrop-blur-sm text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <h3 className="mb-2 text-base font-bold leading-tight sm:text-lg">{noticia.titulo}</h3>
        <div className="flex items-center gap-1.5 text-xs text-amber-light/80">
          <Calendar className="h-3 w-3" />
          <span>{noticia.fecha}</span>
        </div>
      </div>
    </div>
  )
}

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }): ReactNode {
  return (
    <ScrollReveal delay={index * 100}>
      <Link href={`/torneos/${tournament.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-amber/25 dark:border-amber/10 bg-gradient-to-br from-background to-amber/10 dark:to-amber/5 p-6 shadow-sm dark:shadow-none transition-all duration-300 hover:border-amber/50 dark:hover:border-amber/30 hover:shadow-xl hover:shadow-amber/10 dark:hover:shadow-amber/5 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber/5 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-terracotta transition-colors">
                {tournament.title}
              </h3>
              {tournament.isOngoing && (
                <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                  En curso
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-amber flex-shrink-0" />
              <span className="line-clamp-1">
                {formatTournamentDate(tournament)}
                {tournament.time && ` - ${tournament.time}`}
              </span>
            </div>
            {tournament.place && (
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-amber flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{tournament.place}</span>
              </div>
            )}
            {tournament.description && (
              <p className="mt-4 text-sm text-muted-foreground/80 line-clamp-2">{tournament.description}</p>
            )}
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-terracotta group-hover:text-terracotta-light transition-colors">
              <span>Ver detalles</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, action }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  action?: { href: string; label: string }
}): ReactNode {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 dark:bg-amber/10">
            <Icon className="h-5 w-5 text-amber" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
        </div>
        <p className="text-muted-foreground ml-[52px]">{subtitle}</p>
      </div>
      {action && (
        <Button asChild variant="ghost" className="text-amber-dark hover:text-amber hover:bg-amber/10 self-start sm:self-auto">
          <Link href={action.href} className="flex items-center gap-2">
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}

const faqs = [
  {
    question: "¿Cómo puedo afiliar mi club a FASGBA?",
    answer: "Para afiliar tu club, debés completar el formulario de afiliación disponible en la sección de Clubes y enviarlo junto con la documentación requerida. También podés contactarnos por email o acercarte a cualquiera de nuestros clubes afiliados para más información.",
  },
  {
    question: "¿Cómo me inscribo en un torneo?",
    answer: "Podés inscribirte directamente desde la página del torneo que te interese, donde encontrarás los detalles de inscripción, costos y requisitos. Algunos torneos también permiten inscripción presencial el día del evento.",
  },
  {
    question: "¿Necesito tener rating para participar en torneos?",
    answer: "No es necesario tener rating para participar en la mayoría de nuestros torneos. Contamos con categorías para todos los niveles, desde principiantes hasta jugadores avanzados. Al participar, comenzarás a obtener tu rating FASGBA.",
  },
  {
    question: "¿Cómo puedo consultar mi rating o el de otro jugador?",
    answer: "Podés consultar los ratings en la sección de Rankings de nuestro sitio. Ahí encontrarás el listado completo de jugadores con su rating actualizado, con opciones de búsqueda por nombre o club.",
  },
  {
    question: "¿Qué beneficios tiene ser parte de un club afiliado?",
    answer: "Los jugadores de clubes afiliados pueden participar en todos los torneos oficiales de FASGBA, acceder al sistema de rankings, representar a su club en competencias interclub y formar parte de una comunidad activa de ajedrecistas en la región sur del Gran Buenos Aires.",
  },
  {
    question: "¿Cómo puedo contactar a FASGBA?",
    answer: "Podés escribirnos a través de nuestras redes sociales o por email. También podés acercarte a cualquiera de nuestros clubes afiliados, donde te podrán orientar y poner en contacto con la federación.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

function FaqContent(): ReactNode {
  return (
    <div className="container px-4 md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 dark:bg-amber/10">
              <HelpCircle className="h-5 w-5 text-amber" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Preguntas Frecuentes
            </h2>
          </div>
          <p className="text-muted-foreground ml-[52px]">
            Respuestas a las consultas más comunes
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl">
        <FaqAccordion items={faqs} />
      </div>
    </div>
  )
}

export default async function Home() {
  const [news, tournaments, clubs] = await Promise.all([
    fetchNews(), fetchTournaments(), fetchClubs()
  ])

  const noticias = news.map((item, i) => mapNewsToNoticia(item, i === 0))
  const noticiaDestacada = noticias.find(n => n.destacada)
  const noticiasSecundarias = noticias.filter(n => !n.destacada)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/" />
      <main className="flex-1">

        {/* ===== HERO ===== */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
          <HeroAurora />

          <div className="container relative z-10 px-4 md:px-6 text-center">
            <div className="mx-auto max-w-4xl space-y-8">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="text-foreground dark:text-white">Federación de Ajedrez</span>
                <br />
                <span className="gradient-text">del Sur del Gran Buenos Aires</span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-white/60 md:text-xl">
                Promoviendo y desarrollando el ajedrez en la región sur de Buenos Aires desde 1975
              </p>

              <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center pt-2">
                <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta-dark dark:bg-amber dark:hover:bg-amber-dark text-white rounded-xl px-8 h-12 text-base shadow-lg shadow-terracotta/20 dark:shadow-amber/20">
                  <Link href="/torneos">
                    <Trophy className="mr-2 h-5 w-5" />
                    Próximos Torneos
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-amber/40 text-amber-dark hover:bg-amber/10 dark:border-amber-light/40 dark:text-amber-light dark:hover:bg-amber-light/10 rounded-xl px-8 h-12 text-base">
                  <Link href="/clubes">
                    <Users className="mr-2 h-5 w-5" />
                    Clubes Afiliados
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ===== NEWS ===== */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <ScrollReveal>
              <SectionHeader
                icon={Newspaper}
                title="Últimas Noticias"
                subtitle="Mantente al día con las novedades de FASGBA"
                action={{ href: '/noticias', label: 'Ver todas' }}
              />
            </ScrollReveal>

            {noticias.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-6">
                {noticiaDestacada && (
                  <ScrollReveal className="lg:col-span-2 h-[350px] sm:h-[400px] lg:h-[500px]">
                    <Link href={`/noticias/${noticiaDestacada.id}`} className="block h-full">
                      <NoticiaDestacada noticia={noticiaDestacada} />
                    </Link>
                  </ScrollReveal>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                  {noticiasSecundarias.slice(0, 2).map((noticia, i) => (
                    <ScrollReveal key={noticia.id} delay={i * 100} className="h-[220px] lg:h-[238px]">
                      <Link href={`/noticias/${noticia.id}`} className="block h-full">
                        <NoticiaCard noticia={noticia} />
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>

                {noticiasSecundarias.length > 2 && (
                  <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {noticiasSecundarias.slice(2, 4).map((noticia, i) => (
                      <ScrollReveal key={noticia.id} delay={i * 100} className="h-[220px]">
                        <Link href={`/noticias/${noticia.id}`} className="block h-full">
                          <NoticiaCard noticia={noticia} />
                        </Link>
                      </ScrollReveal>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay noticias disponibles en este momento.</p>
              </div>
            )}
          </div>
        </section>

        <div className="section-divider mx-auto max-w-5xl" />

        {/* ===== TOURNAMENTS ===== */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <ScrollReveal>
              <SectionHeader
                icon={Trophy}
                title="Torneos"
                subtitle="Torneos en curso y próximos organizados por FASGBA"
                action={{ href: '/torneos', label: 'Ver todos' }}
              />
            </ScrollReveal>

            {tournaments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament, i) => (
                  <TournamentCard key={tournament.id} tournament={tournament} index={i} />
                ))}
              </div>
            ) : (
              <ScrollReveal>
                <div className="text-center py-16 rounded-2xl border border-dashed border-amber/30 dark:border-amber/20">
                  <Trophy className="mx-auto h-12 w-12 text-amber/30 mb-4" />
                  <p className="text-muted-foreground">No hay torneos próximos programados.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Mantente atento a nuestras redes sociales para futuras actualizaciones.
                  </p>
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>

        <div className="section-divider mx-auto max-w-5xl" />

        {/* ===== CLUBS ===== */}
        <section className="w-full py-16 md:py-24 overflow-hidden">
          <div className="container px-4 md:px-6">
            <ScrollReveal>
              <SectionHeader
                icon={Users}
                title="Clubes Afiliados"
                subtitle="Conoce los clubes que forman parte de FASGBA"
                action={{ href: '/clubes', label: 'Ver todos' }}
              />
            </ScrollReveal>
          </div>

          {clubs.length > 0 ? (
            <ScrollReveal>
              <ClubMarquee clubs={clubs} />
            </ScrollReveal>
          ) : (
            <div className="container px-4 md:px-6 text-center py-12">
              <p className="text-muted-foreground">No hay clubes afiliados disponibles.</p>
            </div>
          )}
        </section>

        <div className="section-divider mx-auto max-w-5xl" />

        {/* ===== FAQ ===== */}
        <section className="w-full py-16 md:py-24">
          <ScrollReveal>
            <FaqContent />
          </ScrollReveal>
        </section>

      </main>
      <SiteFooter />
    </div>
  )
}
