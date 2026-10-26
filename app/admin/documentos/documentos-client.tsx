"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { DocumentoUploadCard } from "./documento-upload-card"
import { DocumentosSettingsDialog } from "./documentos-settings-dialog"
import { DocumentosTable } from "./documentos-table"
import { useDocumentosList } from "./use-documentos-list"
import type { CategoryImportance, Documento } from "./types"

// Feedback goes through sonner toasts; empty messages (used to "clear") are ignored.
const notifyError = (message: string) => {
  if (message) toast.error(message)
}
const notifySuccess = (message: string) => {
  if (message) toast.success(message)
}

interface AdminDocumentosClientProps {
  initialDocuments: Documento[]
  initialTotalDocuments: number
  initialCategoryImportance: CategoryImportance
}

export function AdminDocumentosClient({
  initialDocuments,
  initialTotalDocuments,
  initialCategoryImportance,
}: AdminDocumentosClientProps) {
  const [showSettings, setShowSettings] = useState(false)

  const list = useDocumentosList({
    initialDocuments,
    initialTotalDocuments,
    setErrorMessage: notifyError,
    setSuccessMessage: notifySuccess,
  })

  return (
    <div className="flex-1 space-y-6">
      <AdminPageHeader
        title="Documentos"
        action={
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
        }
      />

      <DocumentoUploadCard
        onUploaded={(documentId) => list.loadDocuments({ ensureDocumentId: documentId })}
        setErrorMessage={notifyError}
        setSuccessMessage={notifySuccess}
      />

      <DocumentosTable
        documents={list.documents}
        totalDocuments={list.totalDocuments}
        isLoading={list.isLoading}
        sortOption={list.sortOption}
        setSortOption={list.setSortOption}
        isSavingOrder={list.isSavingOrder}
        hasOrderChanges={list.hasOrderChanges}
        saveCustomOrder={list.saveCustomOrder}
        draggedId={list.draggedId}
        handleRowDragStart={list.handleRowDragStart}
        handleRowDragEnd={list.handleRowDragEnd}
        handleRowDragOver={list.handleRowDragOver}
        moveDocument={list.moveDocument}
        hasMoreDocuments={list.hasMoreDocuments}
        isLoadingMore={list.isLoadingMore}
        loadMoreDocuments={list.loadMoreDocuments}
        loadMoreRef={list.loadMoreRef}
        setDocuments={list.setDocuments}
        setTotalDocuments={list.setTotalDocuments}
        setErrorMessage={notifyError}
        setSuccessMessage={notifySuccess}
      />

      <DocumentosSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        initialCategoryImportance={initialCategoryImportance}
        onSaved={() => {
          if (list.sortOption === "importance") {
            return list.loadDocuments()
          }
        }}
        setErrorMessage={notifyError}
        setSuccessMessage={notifySuccess}
      />
    </div>
  )
}
