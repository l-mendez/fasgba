import { AdminDocumentosClient } from "@/app/admin/documentos/documentos-client"
import { getAdminDocumentosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default async function AdminDocumentosPage() {
  const { documents, totalDocuments, categoryImportance } = await getAdminDocumentosInitialData()

  return (
    <AdminDocumentosClient
      initialDocuments={documents}
      initialTotalDocuments={totalDocuments}
      initialCategoryImportance={categoryImportance}
    />
  )
}
