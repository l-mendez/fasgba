import { redirect } from "next/navigation"
import { PageHero } from "@/components/page-hero"
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
      <PageHero title="Ajustes" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl">
            {/* Auto-unsubscribe via query param notifications=off */}
            <UnsubscribeHandler />
            <SettingsForm initial={initial || undefined} />
          </div>
        </div>
      </section>
    </>
  )
}

// Unsubscribe client logic moved to components/unsubscribe-handler.tsx
