export const dynamic = 'force-dynamic'

import Link from "next/link"
import { unstable_cache } from "next/cache"
import { FileText, FileSpreadsheet, Download, Eye, Calendar, FolderOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { createAdminClient } from "@/lib/supabase/admin"
import { EscuelaSection } from "@/components/escuela-document-card"
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_COLORS,
  formatFileSize,
  formatArgentinaDate,
  getDocumentUrl,
  isValidCategory,
  type DocumentCategory,
} from "@/lib/documentosUtils"

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300

interface Documento {
  id: number
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  sort_order: number
  importance_level: number
  created_at: string
}

interface PageProps {
  searchParams: Promise<{
    categoria?: string
  }>
}

// Cached data fetcher - uses admin client to avoid cookies in cache scope
const getCachedDocumentos = unstable_cache(
  async () => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("documentos")
      .select("id, name, category, file_path, file_size, sort_order, importance_level, created_at")
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching documentos:", error)
      return []
    }

    return data || []
  },
  ["documentos-list"],
  { revalidate: 300, tags: ["documentos"] }
)

async function fetchDocumentos(): Promise<Documento[]> {
  try {
    return await getCachedDocumentos()
  } catch (error) {
    console.error("Error fetching documentos:", error)
    return []
  }
}

function filterByCategory(documentos: Documento[], category: string): Documento[] {
  if (!category || category === "todos" || !isValidCategory(category)) {
    return documentos
  }
  return documentos.filter((doc) => doc.category === category)
}

function groupByCategory(documentos: Documento[]): Record<DocumentCategory, Documento[]> {
  const grouped: Record<DocumentCategory, Documento[]> = {
    reglamentos: [],
    actas: [],
    minutas: [],
    escuela: [],
    otros: [],
  }

  for (const doc of documentos) {
    if (grouped[doc.category]) {
      grouped[doc.category].push(doc)
    }
  }

  return grouped
}

export default async function DocumentosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const selectedCategory = params.categoria || "todos"

  const allDocumentos = await fetchDocumentos()
  const filteredDocumentos = filterByCategory(allDocumentos, selectedCategory)
  const hasActiveFilter = selectedCategory !== "todos" && isValidCategory(selectedCategory)

  // Group documents by category for display when showing all
  const groupedDocumentos = !hasActiveFilter ? groupByCategory(filteredDocumentos) : null

  // Count documents per category for the filter badges
  const categoryCounts = {
    todos: allDocumentos.length,
    reglamentos: allDocumentos.filter((d) => d.category === "reglamentos").length,
    actas: allDocumentos.filter((d) => d.category === "actas").length,
    minutas: allDocumentos.filter((d) => d.category === "minutas").length,
    escuela: allDocumentos.filter((d) => d.category === "escuela").length,
    otros: allDocumentos.filter((d) => d.category === "otros").length,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/documentos" />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">
                  Documentos
                </h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Documentos oficiales de la Federación de Ajedrez del Sur del Gran Buenos Aires
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <Link href="/documentos">
                  <Badge
                    variant={selectedCategory === "todos" ? "default" : "outline"}
                    className={`cursor-pointer text-sm py-1.5 px-3 ${
                      selectedCategory === "todos"
                        ? "bg-terracotta hover:bg-terracotta/90"
                        : "hover:bg-amber/10"
                    }`}
                  >
                    Todos ({categoryCounts.todos})
                  </Badge>
                </Link>
                {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                  <Link key={key} href={`/documentos?categoria=${key}`}>
                    <Badge
                      variant={selectedCategory === key ? "default" : "outline"}
                      className={`cursor-pointer text-sm py-1.5 px-3 ${
                        selectedCategory === key
                          ? "bg-terracotta hover:bg-terracotta/90"
                          : "hover:bg-amber/10"
                      }`}
                    >
                      {label} ({categoryCounts[key as keyof typeof categoryCounts]})
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            {/* Results info */}
            <div className="mb-6 text-sm text-muted-foreground">
              Mostrando {filteredDocumentos.length} documento
              {filteredDocumentos.length !== 1 ? "s" : ""}
              {hasActiveFilter && ` en ${DOCUMENT_CATEGORIES[selectedCategory as DocumentCategory]}`}
            </div>

            {/* Content */}
            {filteredDocumentos.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilter
                    ? "No se encontraron documentos en esta categoría."
                    : "No hay documentos disponibles en este momento."}
                </p>
                {hasActiveFilter && (
                  <Link href="/documentos">
                    <Button
                      variant="outline"
                      className="border-amber text-amber-dark hover:bg-amber/10"
                    >
                      Ver todos los documentos
                    </Button>
                  </Link>
                )}
              </div>
            ) : hasActiveFilter && selectedCategory === 'escuela' ? (
              // Escuela category uses special auth-gated component
              <EscuelaSection
                documentos={filteredDocumentos.map((doc) => ({
                  id: doc.id,
                  name: doc.name,
                  category: 'escuela' as const,
                  file_size: doc.file_size,
                  created_at: doc.created_at,
                  file_ext: doc.file_path?.split('.').pop()?.toLowerCase(),
                }))}
              />
            ) : hasActiveFilter ? (
              // Show flat list when filtering by category
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocumentos.map((documento) => (
                  <DocumentCard key={documento.id} documento={documento} />
                ))}
              </div>
            ) : (
              // Show grouped by category when showing all
              <div className="space-y-10">
                {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, categoryLabel]) => {
                  const categoryDocs = groupedDocumentos?.[categoryKey as DocumentCategory] || []
                  if (categoryDocs.length === 0) return null

                  // Escuela section uses a special client component with auth checks
                  if (categoryKey === 'escuela') {
                    const escuelaDocs = categoryDocs.map((doc) => ({
                      id: doc.id,
                      name: doc.name,
                      category: 'escuela' as const,
                      file_size: doc.file_size,
                      created_at: doc.created_at,
                      file_ext: doc.file_path?.split('.').pop()?.toLowerCase(),
                    }))
                    return <EscuelaSection key={categoryKey} documentos={escuelaDocs} />
                  }

                  return (
                    <div key={categoryKey}>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-xl font-semibold text-terracotta">{categoryLabel}</h2>
                        <Badge variant="secondary" className="text-xs">
                          {categoryDocs.length}
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categoryDocs.map((documento) => (
                          <DocumentCard key={documento.id} documento={documento} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function DocumentCard({ documento }: { documento: Documento }) {
  const documentUrl = getDocumentUrl(documento.file_path)
  const ext = documento.file_path?.split('.').pop()?.toLowerCase()
  const isExcel = ext === 'xls' || ext === 'xlsx'

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
          {documentUrl && (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <a href={documentUrl} download={`${documento.name}.${ext || 'pdf'}`}>
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
