import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function JugadoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Suspense: the pages read ?from= with useSearchParams */}
      <main className="flex-1">
        <Suspense>{children}</Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
