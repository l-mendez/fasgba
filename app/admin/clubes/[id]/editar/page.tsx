import { EditarClubClient } from "@/app/admin/clubes/[id]/editar/editar-club-client"
import { getAdminClubEditData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarClubPage({ params }: PageProps) {
  const { id } = await params
  const club = await getAdminClubEditData(id)

  return <EditarClubClient club={club} />
}
