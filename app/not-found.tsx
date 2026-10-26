import { NotFoundContent } from "@/components/not-found-content"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  )
}
