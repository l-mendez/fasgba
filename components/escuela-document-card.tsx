"use client"

import { useState } from "react"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, Lock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
  formatFileSize,
  formatArgentinaDate,
  type DocumentCategory,
} from "@/lib/documentosUtils"
import { createClient } from "@/lib/supabase/client"

interface ProtectedDocumento {
  id: number
  name: string
  category: DocumentCategory
  file_size: number | null
  created_at: string
  file_ext?: string
}

// Keep legacy type for backwards compatibility
type EscuelaDocumento = ProtectedDocumento

function ProtectedDocumentCard({ documento }: { documento: ProtectedDocumento }) {
  const [loadingAction, setLoadingAction] = useState<'view' | 'download' | null>(null)
  const isExcel = documento.file_ext === 'xls' || documento.file_ext === 'xlsx'

  const handleAction = async (action: 'view' | 'download') => {
    setLoadingAction(action)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/documentos/download/${documento.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()

      if (res.ok && json.url) {
        if (action === 'view') {
          window.open(json.url, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = json.url
          a.download = `${documento.name}.${documento.file_ext || 'pdf'}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error fetching document URL:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExcel ? 'bg-green-100' : 'bg-red-100'}`}>
              {isExcel ? (
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-red-600" />
              )}
            </div>
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
            <Badge
              variant="secondary"
              className={`text-xs ${CATEGORY_COLORS[documento.category]}`}
            >
              {DOCUMENT_CATEGORIES[documento.category]}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('view')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'view' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleAction('download')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'download' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProtectedSection({ documentos, label }: { documentos: ProtectedDocumento[]; label: string }) {
  if (documentos.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5 text-terracotta" />
        <h2 className="text-xl font-semibold text-terracotta">{label}</h2>
        <Badge variant="secondary" className="text-xs">
          {documentos.length}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentos.map((documento) => (
          <ProtectedDocumentCard key={documento.id} documento={documento} />
        ))}
      </div>
    </div>
  )
}

// Backwards-compatible exports
export const EscuelaSection = ({ documentos }: { documentos: EscuelaDocumento[] }) => (
  <ProtectedSection documentos={documentos} label="Escuela" />
)
