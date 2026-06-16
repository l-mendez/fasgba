"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, FolderOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProtectedSection } from "@/components/escuela-document-card"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
  formatFileSize,
  formatArgentinaDate,
  getDocumentUrl,
  isValidCategory,
  type DocumentCategory,
} from "@/lib/documentosUtils"

export interface PublicDocumento {
  id: number
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  created_at: string
}

const PUBLIC_CATEGORIES: DocumentCategory[] = ["reglamentos", "actas", "minutas"]
const PROTECTED_CATEGORIES = ["escuela", "otros"] as const
type ProtectedCategory = (typeof PROTECTED_CATEGORIES)[number]

function groupPublic(docs: PublicDocumento[]): Record<DocumentCategory, PublicDocumento[]> {
  const grouped: Record<DocumentCategory, PublicDocumento[]> = {
    reglamentos: [],
    actas: [],
    minutas: [],
    escuela: [],
    otros: [],
  }
  for (const doc of docs) grouped[doc.category]?.push(doc)
  return grouped
}

// Client island: filters the (public-only) document set client-side so the page
// stays statically cacheable. Protected categories are rendered exclusively via
// ProtectedSection, which fetches its own documents with the user's auth token —
// no protected metadata is ever passed in as a server prop.
export function DocumentosList({ publicDocs }: { publicDocs: PublicDocumento[] }) {
  const searchParams = useSearchParams()
  const raw = searchParams.get("categoria") || "todos"
  const selected = raw === "todos" || isValidCategory(raw) ? raw : "todos"

  const [protectedCounts, setProtectedCounts] = useState<Record<ProtectedCategory, number>>({
    escuela: 0,
    otros: 0,
  })

  const setEscuelaCount = useCallback(
    (n: number) => setProtectedCounts((prev) => (prev.escuela === n ? prev : { ...prev, escuela: n })),
    []
  )
  const setOtrosCount = useCallback(
    (n: number) => setProtectedCounts((prev) => (prev.otros === n ? prev : { ...prev, otros: n })),
    []
  )

  const grouped = useMemo(() => groupPublic(publicDocs), [publicDocs])

  const categoryCounts: Record<string, number> = {
    todos: publicDocs.length + protectedCounts.escuela + protectedCounts.otros,
    reglamentos: grouped.reglamentos.length,
    actas: grouped.actas.length,
    minutas: grouped.minutas.length,
    escuela: protectedCounts.escuela,
    otros: protectedCounts.otros,
  }

  // Public categories always appear; protected categories appear only once the
  // viewer is shown to have access (i.e. the client fetch returned documents).
  const filterCategories: DocumentCategory[] = [
    ...PUBLIC_CATEGORIES,
    ...PROTECTED_CATEGORIES.filter((c) => protectedCounts[c] > 0),
  ]

  const protectedMode = (category: ProtectedCategory): "hidden" | "grouped" | "solo" =>
    selected === "todos" ? "grouped" : selected === category ? "solo" : "hidden"

  const isPublicSelected =
    selected !== "todos" && PUBLIC_CATEGORIES.includes(selected as DocumentCategory)
  const selectedPublicDocs = isPublicSelected ? grouped[selected as DocumentCategory] : []

  const filteredCount = selected === "todos" ? categoryCounts.todos : categoryCounts[selected]
  const isTodosEmpty = selected === "todos" && categoryCounts.todos === 0

  const badgeClass = (active: boolean) =>
    `cursor-pointer text-sm py-1.5 px-3 ${
      active ? "bg-terracotta hover:bg-terracotta/90" : "hover:bg-amber/10"
    }`

  return (
    <div className="container px-4 md:px-6">
      {/* Category filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Link href="/documentos">
            <Badge variant={selected === "todos" ? "default" : "outline"} className={badgeClass(selected === "todos")}>
              Todos ({categoryCounts.todos})
            </Badge>
          </Link>
          {filterCategories.map((key) => (
            <Link key={key} href={`/documentos?categoria=${key}`}>
              <Badge variant={selected === key ? "default" : "outline"} className={badgeClass(selected === key)}>
                {DOCUMENT_CATEGORIES[key]} ({categoryCounts[key]})
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Results info */}
      <div className="mb-6 text-sm text-muted-foreground">
        Mostrando {filteredCount} documento{filteredCount !== 1 ? "s" : ""}
        {selected !== "todos" && ` en ${DOCUMENT_CATEGORIES[selected as DocumentCategory]}`}
      </div>

      <div className="space-y-10">
        {/* Public documents */}
        {selected === "todos"
          ? PUBLIC_CATEGORIES.map((key) => {
              const docs = grouped[key]
              if (docs.length === 0) return null
              return (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-terracotta">{DOCUMENT_CATEGORIES[key]}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {docs.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {docs.map((documento) => (
                      <DocumentCard key={documento.id} documento={documento} />
                    ))}
                  </div>
                </div>
              )
            })
          : isPublicSelected && selectedPublicDocs.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedPublicDocs.map((documento) => (
                  <DocumentCard key={documento.id} documento={documento} />
                ))}
              </div>
            )}

        {/* Protected documents — always mounted so the filter badges/counts stay
            accurate; each section renders only when its mode allows. */}
        <ProtectedSection category="escuela" label="Escuela" mode={protectedMode("escuela")} onCountChange={setEscuelaCount} />
        <ProtectedSection category="otros" label="Otros" mode={protectedMode("otros")} onCountChange={setOtrosCount} />
      </div>

      {/* Empty states */}
      {(isTodosEmpty || (isPublicSelected && selectedPublicDocs.length === 0)) && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            {selected === "todos"
              ? "No hay documentos disponibles en este momento."
              : "No se encontraron documentos en esta categoría."}
          </p>
          {selected !== "todos" && (
            <Link href="/documentos">
              <Button variant="brandOutline">
                Ver todos los documentos
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DocumentCard({ documento }: { documento: PublicDocumento }) {
  const documentUrl = getDocumentUrl(documento.file_path)
  const ext = documento.file_path?.split(".").pop()?.toLowerCase()
  const isExcel = ext === "xls" || ext === "xlsx"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExcel ? "bg-green-100" : "bg-red-100"}`}>
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
            <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[documento.category]}`}>
              {DOCUMENT_CATEGORIES[documento.category]}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {documentUrl && (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href={documentUrl} download={`${documento.name}.${ext || "pdf"}`}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </a>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
