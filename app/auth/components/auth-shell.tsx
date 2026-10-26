import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteLogo } from "@/components/site-logo"
import { Card, CardContent } from "@/components/ui/card"

interface AuthShellProps {
  title: string
  children: React.ReactNode
  // Secondary links shown under the card (e.g. "¿No tienes una cuenta?").
  links?: React.ReactNode
}

// Centered single-column layout shared by login, registro and password flows.
export function AuthShell({ title, children, links }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Inicio
        </Link>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 py-8 md:items-center md:py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <SiteLogo />
            <h1 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">{title}</h1>
          </div>
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
          {links && <div className="space-y-2 text-center text-sm text-muted-foreground">{links}</div>}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// Link style for the secondary auth links.
export const authLinkClass = "font-medium text-terracotta underline-offset-4 hover:underline"
