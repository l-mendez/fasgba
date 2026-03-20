import Link from "next/link"
import { Facebook, Instagram, Mail, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-amber/20 bg-gradient-to-b from-background to-amber/5">
      <div className="container grid gap-8 py-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-terracotta">FASGBA</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Federación de Ajedrez del Sur del Gran Buenos Aires - Promoviendo el ajedrez en la región desde 1975
          </p>
          <div className="mt-4 flex gap-4">
            <Button variant="ghost" size="icon" asChild className="text-amber hover:text-amber-dark hover:bg-amber/10">
              <Link href="https://facebook.com/FASGBA" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="text-amber hover:text-amber-dark hover:bg-amber/10">
              <Link href="https://www.instagram.com/fasgba_ok" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-medium text-terracotta">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/clubes" className="text-muted-foreground hover:text-amber-dark">
                Clubes Afiliados
              </Link>
            </li>
            <li>
              <Link href="/torneos" className="text-muted-foreground hover:text-amber-dark">
                Próximos Torneos
              </Link>
            </li>
            <li>
              <Link href="/ranking" className="text-muted-foreground hover:text-amber-dark">
                Ranking FASGBA
              </Link>
            </li>
            {/* <li>
              <Link href="/reglamentos/fide" className="text-muted-foreground hover:text-amber-dark">
                Reglamentos
              </Link>
            </li>
            <li>
              <Link href="/cursos" className="text-muted-foreground hover:text-amber-dark">
                Cursos y Clases
              </Link>
            </li>
            <li>
              <Link href="/historia" className="text-muted-foreground hover:text-amber-dark">
                Historia de FASGBA
              </Link>
            </li> */}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-medium text-terracotta">Recursos</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="https://uxtfxazbikfqcnnmhufh.supabase.co/storage/v1/object/public/footer-files/cd2025-2027.xlsx" className="text-muted-foreground hover:text-amber-dark">
                Comisión Directiva
              </Link>
            </li>
            <li>
              <Link href="https://uxtfxazbikfqcnnmhufh.supabase.co/storage/v1/object/public/footer-files/calendario2025.xlsx" className="text-muted-foreground hover:text-amber-dark">
                Calendario Anual
              </Link>
            </li>
            <li>
              <Link href="https://uxtfxazbikfqcnnmhufh.supabase.co/storage/v1/object/public/footer-files/estatuto.pdf" className="text-muted-foreground hover:text-amber-dark">
                Estatuto
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-medium text-terracotta">Contacto</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber" />
              <span className="text-muted-foreground">+54 911 4028 2610</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber" />
              <span className="text-muted-foreground">secretaria@fasgba.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-amber/20 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © 2026 Federación de Ajedrez del Sur del Gran Buenos Aires. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/politica-privacidad" className="hover:text-amber-dark">
              Política de Privacidad
            </Link>
            <Link href="/terminos-condiciones" className="hover:text-amber-dark">
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

