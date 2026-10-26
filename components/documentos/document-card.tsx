"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatFileSize,
  formatArgentinaDate,
  getDocumentoExtension,
  isSpreadsheetExtension,
  type DocumentoSummary,
} from "@/lib/documentosUtils"
import { openDocumento, type DocumentoAction } from "@/lib/documentos-client"

export function DocumentCard({ documento }: { documento: DocumentoSummary }) {
  const [loadingAction, setLoadingAction] = useState<DocumentoAction | null>(null)
  const isExcel = isSpreadsheetExtension(getDocumentoExtension(documento.file_path))

  const handleAction = async (action: DocumentoAction) => {
    setLoadingAction(action)
    try {
      await openDocumento(documento, action)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    } finally {
      setLoadingAction(null)
    }
  }

  const actionButton = (action: DocumentoAction, Icon: typeof Eye, label: string) => (
    <Button
      variant="outline"
      size="sm"
      className="flex-1"
      onClick={() => handleAction(action)}
      disabled={loadingAction !== null}
    >
      {loadingAction === action ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  )

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          {isExcel ? <FileSpreadsheet className="h-5 w-5 text-amber" /> : <FileText className="h-5 w-5 text-amber" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 font-medium leading-snug">{documento.name}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatArgentinaDate(documento.created_at)}</span>
            {documento.file_size && <span>· {formatFileSize(documento.file_size)}</span>}
          </p>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        {/* Browsers can't preview spreadsheets: "Ver" would just download them. */}
        {!isExcel && actionButton("view", Eye, "Ver")}
        {actionButton("download", Download, "Descargar")}
      </div>
    </div>
  )
}
