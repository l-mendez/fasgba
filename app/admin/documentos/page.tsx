import { Suspense } from "react"
import { FileText } from "lucide-react"

import { AdminDocumentosClient } from "@/app/admin/documentos/documentos-client"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { getAdminDocumentosInitialData } from "@/lib/admin/initial-data"

export const dynamic = "force-dynamic"

export default function AdminDocumentosPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Documentos"
        subtitle="Sube y organiza documentos públicos y protegidos de FASGBA."
        action={
          <Badge variant="outline" className="w-fit">
            <FileText className="mr-1 h-3 w-3" />
            Archivos PDF y Excel
          </Badge>
        }
      />
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
      showFormatBadge={false}
      showHeader={false}
      initialDocuments={documents}
      initialTotalDocuments={totalDocuments}
      initialCategoryImportance={categoryImportance}
    />
  )
}
