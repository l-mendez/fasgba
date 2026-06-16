import { EditarArbitroClient } from "@/app/admin/arbitros/[id]/editar/editar-arbitro-client"
import { getAdminArbitroEditData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarArbitroPage({ params }: PageProps) {
  const { id } = await params
  const { arbitro, clubs } = await getAdminArbitroEditData(id)

  return <EditarArbitroClient arbitro={arbitro} initialClubs={clubs} />
}
