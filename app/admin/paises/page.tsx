import { Suspense } from "react"

import { AdminPaisesClient } from "@/app/admin/paises/paises-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminPaisesInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminPaisesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Países"
        subtitle="Controlá desde qué países se puede acceder al sitio. Los cambios tardan hasta 1 minuto en aplicarse."
      />
      <Suspense fallback={<AdminContentSkeleton rows={6} />}>
        <AdminPaisesContent />
      </Suspense>
    </div>
  )
}

async function AdminPaisesContent() {
  const { overview, logs } = await getAdminPaisesInitialData()

  return <AdminPaisesClient initialOverview={overview} initialLogs={logs} />
}
