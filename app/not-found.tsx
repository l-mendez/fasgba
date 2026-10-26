import Link from "next/link"
import { Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-6xl font-bold tracking-tight text-terracotta/30 md:text-7xl">404</p>
          <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Página no encontrada</h1>
          <Button asChild className="bg-terracotta text-white hover:bg-terracotta/90">
            <Link href="/">
              <Home />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
