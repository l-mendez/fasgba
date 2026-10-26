import { SiteHeader } from "@/components/site-header"

// Shared editors (create/edit) live outside the admin shells: keep the site
// header so they still have navigation. Pages render their own back link.
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
