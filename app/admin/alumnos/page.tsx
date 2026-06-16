import { Suspense } from "react"

import { AdminAlumnosClient } from "@/app/admin/alumnos/alumnos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminAlumnosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminAlumnosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Alumnos"
        subtitle="Gestionar alumnos de la escuela. Los alumnos pueden acceder a documentos protegidos de la sección Escuela."
      />
      <Suspense fallback={<AdminContentSkeleton rows={4} />}>
        <AdminAlumnosContent />
      </Suspense>
    </div>
  )
}

async function AdminAlumnosContent() {
  const { alumnos, users, usersTotal } = await getAdminAlumnosInitialData()

  return (
    <AdminAlumnosClient
      showHeader={false}
      initialAlumnos={alumnos}
      initialUsers={users}
      initialUsersTotal={usersTotal}
    />
  )
}
