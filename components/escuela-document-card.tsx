"use client"

import { useEffect, useState } from "react"
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
import { useAuth } from "@/hooks/useAuth"

interface ProtectedDocumento {
  id: number
  name: string
  category: DocumentCategory
  file_size: number | null
  created_at: string
  file_ext?: string
}

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

type ProtectedMode = "hidden" | "grouped" | "solo"

interface ProtectedSectionProps {
  category: "escuela" | "otros"
  label: string
  mode: ProtectedMode
  onCountChange?: (count: number) => void
}

// Auth-gated section: fetches its category's documents client-side with the
// user's token, so protected document metadata never reaches anonymous viewers
// or the statically-cached page. `mode` controls rendering: hidden (mounted only
// to report its count), grouped (shown in the "all" view, hidden when empty), or
// solo (shown on its own, with loading/empty states).
export function ProtectedSection({ category, label, mode, onCountChange }: ProtectedSectionProps) {
  const { isAuthenticated } = useAuth()
  const [documentos, setDocumentos] = useState<ProtectedDocumento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setDocumentos([])
      setLoading(false)
      onCountChange?.(0)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data: { session } } = await createClient().auth.getSession()
        if (!session?.access_token) throw new Error("No session")

        const res = await fetch(`/api/documentos/protected?category=${category}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error("Forbidden")

        const json = await res.json()
        const docs: ProtectedDocumento[] = (json.documentos || []).map((d: {
          id: number; name: string; category: DocumentCategory; file_size: number | null; created_at: string; file_path?: string
        }) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          file_size: d.file_size,
          created_at: d.created_at,
          file_ext: d.file_path?.split(".").pop()?.toLowerCase(),
        }))

        if (!cancelled) {
          setDocumentos(docs)
          onCountChange?.(docs.length)
        }
      } catch {
        if (!cancelled) {
          setDocumentos([])
          onCountChange?.(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, category, onCountChange])

  if (mode === "hidden") return null

  if (documentos.length === 0) {
    if (mode === "grouped") return null
    if (loading) return <div className="animate-pulse h-32 bg-muted rounded-md" />
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay documentos disponibles en esta categoría.
      </div>
    )
  }

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
