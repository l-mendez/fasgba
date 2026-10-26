'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BarChart3, CastleIcon, FileText, FolderOpen, GraduationCap, Trophy } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

// Shared by the desktop nav and the mobile sheet.
export const navLinks = [
  { href: "/torneos", label: "Torneos", icon: Trophy },
  { href: "/clubes", label: "Clubes", icon: CastleIcon },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/noticias", label: "Noticias", icon: FileText },
  { href: "/documentos", label: "Documentos", icon: FolderOpen, restricted: true },
  { href: "/profesores", label: "Profesores", icon: GraduationCap },
  { href: "/arbitraje", label: "Arbitraje", icon: Award },
]

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/")

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname()
  // Hidden until permissions resolve, so anonymous visitors never see it flash.
  const { canViewDocumentos } = useAuth()

  return (
    <nav className={cn("items-center gap-6 text-sm font-medium", className)}>
      {navLinks.filter((link) => !link.restricted || canViewDocumentos).map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "underline-offset-4 hover:underline",
            isActivePath(pathname, href) ? "text-terracotta" : "text-muted-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
