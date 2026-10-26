import { Suspense } from "react"
import { AdminDocumentosClient } from "@/app/admin/documentos/documentos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { getAdminDocumentosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminDocumentosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Documentos" />
      <Suspense fallback={<AdminContentSkeleton rows={5} />}>
        <AdminDocumentosContent />
      </Suspense>
    </div>
  )
}

async function AdminDocumentosContent() {
  const { documents, totalDocuments, categoryImportance } = await getAdminDocumentosInitialData()

  return (
    <AdminDocumentosClient
      showHeader={false}
      initialDocuments={documents}
      initialTotalDocuments={totalDocuments}
      initialCategoryImportance={categoryImportance}
    />
  )
}
