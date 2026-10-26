import Link from "next/link"
import { Mail, Phone } from "lucide-react"

import { Facebook, Instagram } from "@/components/icons/social-icons"
import { SiteLogo } from "@/components/site-logo"
import { Button } from "@/components/ui/button"

const FILES = "https://uxtfxazbikfqcnnmhufh.supabase.co/storage/v1/object/public/footer-files"

const siteLinks = [
  { href: "/torneos", label: "Torneos" },
  { href: "/clubes", label: "Clubes" },
  { href: "/ranking", label: "Ranking" },
  { href: "/noticias", label: "Noticias" },
]

const resources = [
  { href: `${FILES}/cd2025-2027.xlsx`, label: "Comisión Directiva" },
  { href: `${FILES}/calendario2025.xlsx`, label: "Calendario" },
  { href: `${FILES}/estatuto.pdf`, label: "Estatuto" },
]

const socials = [
  { href: "https://facebook.com/FASGBA", label: "Facebook", Icon: Facebook },
  { href: "https://www.instagram.com/fasgba_ok", label: "Instagram", Icon: Instagram },
]

const linkClass = "text-muted-foreground underline-offset-4 hover:underline"
const headingClass = "mb-3 text-sm font-semibold text-terracotta"

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-amber/20 bg-muted/40">
      <div className="container grid grid-cols-2 gap-8 py-8 text-sm lg:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <SiteLogo />
          <div className="-ml-2 flex gap-1">
            {socials.map(({ href, label, Icon }) => (
              <Button key={label} asChild variant="ghost" size="icon" className="text-amber">
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                  <Icon className="h-5 w-5" />
                </a>
              </Button>
            ))}
          </div>
        </div>
        <nav aria-label="Sitio">
          <h3 className={headingClass}>Sitio</h3>
          <ul className="space-y-2">
            {siteLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className={headingClass}>Recursos</h3>
          <ul className="space-y-2">
            {resources.map(({ href, label }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <h3 className={headingClass}>Contacto</h3>
          <ul className="space-y-2">
            <li>
              <a href="tel:+5491140282610" className={`inline-flex items-center gap-2 ${linkClass}`}>
                <Phone className="h-4 w-4 text-amber" />
                +54 911 4028 2610
              </a>
            </li>
            <li>
              <a href="mailto:secretaria@fasgba.com" className={`inline-flex items-center gap-2 ${linkClass}`}>
                <Mail className="h-4 w-4 text-amber" />
                secretaria@fasgba.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-amber/20">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} FASGBA</p>
          <div className="flex gap-4">
            <Link href="/politica-privacidad" className="underline-offset-4 hover:underline">
              Privacidad
            </Link>
            <Link href="/terminos-condiciones" className="underline-offset-4 hover:underline">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
