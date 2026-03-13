"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, Lock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
  formatFileSize,
  formatArgentinaDate,
} from "@/lib/documentosUtils"
import { createClient } from "@/lib/supabase/client"

interface EscuelaDocumento {
  id: number
  name: string
  category: "escuela"
  file_size: number | null
  created_at: string
  file_ext?: string
}

function EscuelaDocumentCard({ documento }: { documento: EscuelaDocumento }) {
  const { isAuthenticated, isAlumno, isAdmin, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const hasAccess = isAuthenticated && (isAlumno || isAdmin)
  const isExcel = documento.file_ext === 'xls' || documento.file_ext === 'xlsx'

  const handleAction = async (action: 'view' | 'download') => {
    if (!hasAccess) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/documentos/download/${documento.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()

      if (res.ok && json.data?.url) {
        if (action === 'view') {
          window.open(json.data.url, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = json.data.url
          a.download = `${documento.name}.${documento.file_ext || 'pdf'}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error fetching document URL:', error)
    } finally {
      setLoading(false)
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
              className={`text-xs ${CATEGORY_COLORS.escuela}`}
            >
              {DOCUMENT_CATEGORIES.escuela}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          {authLoading ? (
            <div className="flex items-center justify-center py-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Verificando acceso...
            </div>
          ) : hasAccess ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleAction('view')}
                disabled={loading}
              >
                {loading ? (
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Descargar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              {!isAuthenticated ? (
                <span>
                  <Link href="/login" className="text-terracotta hover:underline">
                    Iniciá sesión
                  </Link>
                  {" "}para acceder
                </span>
              ) : (
                <span>Acceso restringido a alumnos de la escuela</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EscuelaSection({ documentos }: { documentos: EscuelaDocumento[] }) {
  if (documentos.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-terracotta">Escuela</h2>
        <Badge variant="secondary" className="text-xs">
          {documentos.length}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documentos.map((documento) => (
          <EscuelaDocumentCard key={documento.id} documento={documento} />
        ))}
      </div>
    </div>
  )
}
