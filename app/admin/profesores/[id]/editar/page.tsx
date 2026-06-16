import { EditarProfesorClient } from "@/app/admin/profesores/[id]/editar/editar-profesor-client"
import { getAdminProfesorEditData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarProfesorPage({ params }: PageProps) {
  const { id } = await params
  const { profesor, clubs } = await getAdminProfesorEditData(id)

  return <EditarProfesorClient profesor={profesor} initialClubs={clubs} />
}
