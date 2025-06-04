import { Settings as SettingsIcon } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SettingsForm } from "@/components/settings-form"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

export default function AjustesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/ajustes" />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl px-4 md:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <SettingsIcon className="h-6 w-6 text-terracotta" />
              <h1 className="text-3xl font-bold text-terracotta">Ajustes</h1>
            </div>
            <p className="text-muted-foreground">
              Personaliza tu experiencia en FASGBA
            </p>
          </div>

          <SettingsForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
