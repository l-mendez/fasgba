import { Suspense } from "react"

import { AdminAlumnosClient } from "@/app/admin/alumnos/alumnos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminAlumnosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminAlumnosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <AdminPageHeader title="Alumnos" />
          <AdminContentSkeleton rows={4} filters={false} />
        </div>
      }
    >
      <AdminAlumnosContent />
    </Suspense>
  )
}

async function AdminAlumnosContent() {
  const { alumnos, users, usersTotal } = await getAdminAlumnosInitialData()

  return (
    <AdminAlumnosClient
      initialAlumnos={alumnos}
      initialUsers={users}
      initialUsersTotal={usersTotal}
    />
  )
}
