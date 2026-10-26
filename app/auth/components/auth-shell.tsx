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
      <main className="flex flex-1 items-start justify-center px-4 py-12 md:items-center md:py-16">
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
