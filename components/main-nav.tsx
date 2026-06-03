'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Inicio" },
  { href: "/torneos", label: "Torneos" },
  { href: "/clubes", label: "Clubes" },
  { href: "/ranking", label: "Ranking" },
  { href: "/noticias", label: "Noticias" },
  { href: "/documentos", label: "Documentos" },
  { href: "/profesores", label: "Profesores" },
  { href: "/arbitraje", label: "Arbitraje" },
]

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className={cn("items-center space-x-6 text-sm font-medium", className)}>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "transition-colors hover:text-amber",
            isActive(href) ? "text-amber" : "text-muted-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
