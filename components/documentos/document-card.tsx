"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isExcel ? "bg-green-100" : "bg-red-100"}`}>
            {isExcel ? (
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            ) : (
              <FileText className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{documento.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>{formatArgentinaDate(documento.created_at)}</span>
              {documento.file_size && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(documento.file_size)}</span>
                </>
              )}
            </div>
            <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[documento.category]}`}>
              {DOCUMENT_CATEGORIES[documento.category]}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {actionButton("view", Eye, "Ver")}
          {actionButton("download", Download, "Descargar")}
        </div>
      </CardContent>
    </Card>
  )
}
