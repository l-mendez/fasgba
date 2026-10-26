"use client"

import { useState } from "react"
import { CheckCircle2, Settings } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/error-alert"
import { DocumentoUploadCard } from "./documento-upload-card"
import { DocumentosSettingsDialog } from "./documentos-settings-dialog"
import { DocumentosTable } from "./documentos-table"
import { useDocumentosList } from "./use-documentos-list"
import type { CategoryImportance, Documento } from "./types"

interface AdminDocumentosClientProps {
  initialDocuments: Documento[]
  initialTotalDocuments: number
  initialCategoryImportance: CategoryImportance
  showHeader?: boolean
}

export function AdminDocumentosClient({
  initialDocuments,
  initialTotalDocuments,
  initialCategoryImportance,
  showHeader = true,
}: AdminDocumentosClientProps) {
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const list = useDocumentosList({
    initialDocuments,
    initialTotalDocuments,
    setErrorMessage,
    setSuccessMessage,
  })

  return (
    <div className="flex-1 space-y-6">
      {showHeader ? (
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h2 className="text-2xl font-bold tracking-tight text-terracotta md:text-3xl">Documentos</h2>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </div>
      )}

      {errorMessage && <ErrorAlert message={errorMessage} />}

      {successMessage && (
        <Alert
          variant="default"
          className="bg-muted text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 text-amber" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <DocumentoUploadCard
        onUploaded={(documentId) => list.loadDocuments({ ensureDocumentId: documentId })}
        setErrorMessage={setErrorMessage}
        setSuccessMessage={setSuccessMessage}
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
        setErrorMessage={setErrorMessage}
        setSuccessMessage={setSuccessMessage}
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
        setErrorMessage={setErrorMessage}
        setSuccessMessage={setSuccessMessage}
      />
    </div>
  )
}
