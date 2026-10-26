import Link from "next/link"
import { Home } from "lucide-react"

import { Button } from "@/components/ui/button"

// 404 body shared by the root not-found (with its own header/footer) and the
// (public) one, which renders inside the public layout's header/footer.
export function NotFoundContent() {
  return (
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
  )
}
