import { redirect } from "next/navigation"
import { Settings as SettingsIcon } from "lucide-react"
import { SettingsForm } from "@/components/settings-form"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import UnsubscribeHandler from "@/components/unsubscribe-handler"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

export default async function AjustesPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const initial = (user.user_metadata as any)?.notifications || null
  return (
    <>
      <div className="container max-w-4xl px-4 md:px-6 py-8">
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

        {/* Auto-unsubscribe via query param notifications=off */}
        <UnsubscribeHandler />
        <SettingsForm initial={initial || undefined} />
      </div>
    </>
  )
}

// Unsubscribe client logic moved to components/unsubscribe-handler.tsx
