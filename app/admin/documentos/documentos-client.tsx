"use client"

import { useState } from "react"
import { CheckCircle2, FileText, Settings } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  showFormatBadge?: boolean
  showHeader?: boolean
}

export function AdminDocumentosClient({
  initialDocuments,
  initialTotalDocuments,
  initialCategoryImportance,
  showFormatBadge = true,
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Gestión de Documentos
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-fit">
              <FileText className="mr-1 h-3 w-3" />
              Archivos PDF y Excel
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {showFormatBadge ? (
            <Badge variant="outline" className="w-fit">
              <FileText className="mr-1 h-3 w-3" />
              Archivos PDF y Excel
            </Badge>
          ) : null}
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
          className="border-green-200 bg-green-50 text-green-800"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
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
