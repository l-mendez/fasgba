import { AdminAlumnosClient } from "@/app/admin/alumnos/alumnos-client"
import { getAdminAlumnosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function AdminAlumnosPage() {
  const { alumnos, users, usersTotal } = await getAdminAlumnosInitialData()

  return (
    <AdminAlumnosClient
      initialAlumnos={alumnos}
      initialUsers={users}
      initialUsersTotal={usersTotal}
    />
  )
}
