import Link from "next/link"
import { Home, ChevronLeft, Search, Trophy, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero section with 404 message */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5 relative">
          <div className="absolute inset-0 chess-pattern opacity-20"></div>
          <div className="container px-4 md:px-6 flex flex-col items-center space-y-8 text-center relative z-10">
            {/* 404 Number */}
            <div className="relative">
              <div className="text-8xl md:text-9xl font-bold text-terracotta/20 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl md:text-5xl font-bold text-terracotta">
                  ♔ ♕ ♖
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-terracotta">
                Página No Encontrada
              </h1>
              <p className="mx-auto max-w-[600px] text-lg text-muted-foreground md:text-xl">
                Lo sentimos, la página que estás buscando no existe. Es posible que haya sido movida, 
                eliminada o que la URL sea incorrecta.
              </p>
              <p className="text-amber-dark font-medium">
                ¡Pero no te preocupes! Te ayudamos a encontrar lo que buscas.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center pt-4">
              <Button asChild size="lg" className="bg-terracotta hover:bg-terracotta/90 text-white">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Volver al Inicio
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-amber text-amber-dark hover:bg-amber/10 hover:text-amber-dark"
              >
                <Link href="/torneos">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Torneos
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Helpful Links Section */}
        <section className="w-full py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl mb-4">
                ¿Qué estabas buscando?
              </h2>
              <p className="text-muted-foreground">
                Aquí tienes algunos enlaces útiles para navegar por nuestro sitio
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              {/* Torneos */}
              <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-gradient-to-b from-amber/5 to-transparent p-6 hover:border-amber/40 transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <Trophy className="h-5 w-5 text-amber" />
                  <h3 className="font-semibold text-terracotta">Torneos</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta los próximos torneos y competencias de ajedrez en la región.
                </p>
                <Button asChild variant="outline" size="sm" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/torneos">Ver Torneos</Link>
                </Button>
              </div>

              {/* Clubes */}
              <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-gradient-to-b from-amber/5 to-transparent p-6 hover:border-amber/40 transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-5 w-5 text-amber" />
                  <h3 className="font-semibold text-terracotta">Clubes</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Encuentra clubes afiliados a FASGBA en tu zona.
                </p>
                <Button asChild variant="outline" size="sm" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/clubes">Ver Clubes</Link>
                </Button>
              </div>

              {/* Ranking */}
              <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-gradient-to-b from-amber/5 to-transparent p-6 hover:border-amber/40 transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="h-5 w-5 text-amber" />
                  <h3 className="font-semibold text-terracotta">Ranking</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Consulta el ranking oficial de jugadores de la federación.
                </p>
                <Button asChild variant="outline" size="sm" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/ranking">Ver Ranking</Link>
                </Button>
              </div>

              {/* Noticias */}
              <div className="group relative overflow-hidden rounded-lg border border-amber/20 bg-gradient-to-b from-amber/5 to-transparent p-6 hover:border-amber/40 transition-all duration-300">
                <div className="flex items-center space-x-2 mb-3">
                  <ChevronLeft className="h-5 w-5 text-amber rotate-180" />
                  <h3 className="font-semibold text-terracotta">Noticias</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Mantente al día con las últimas noticias del ajedrez regional.
                </p>
                <Button asChild variant="outline" size="sm" className="border-amber text-amber-dark hover:bg-amber/10">
                  <Link href="/noticias">Ver Noticias</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="w-full py-12 bg-gradient-to-b from-terracotta/5 to-amber/5">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-xl font-bold text-terracotta">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-muted-foreground">
                Si no encuentras lo que buscas, no dudes en contactarnos. 
                Estamos aquí para ayudarte con cualquier consulta sobre FASGBA.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta/10">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir al Inicio
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
} 