"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"
import { FolderOpen, Lock, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentCard } from "@/components/documentos/document-card"
import { useAuth } from "@/hooks/useAuth"
import { apiCall, ApiCallError } from "@/lib/utils/apiClient"
import {
  ALL_CATEGORIES,
  DOCUMENT_CATEGORIES,
  isValidCategory,
  type DocumentCategory,
  type DocumentoSummary,
} from "@/lib/documentosUtils"

type ListState =
  | { status: "loading" | "forbidden" | "error" }
  | { status: "ready"; docs: DocumentoSummary[] }

// Client island: the /documentos page is a static shell. Documents are fetched
// here with the viewer's session and the server decides what they may see, so
// no metadata reaches anonymous users or the prerendered HTML. Filtering works
// via badges and ?categoria=.
export function DocumentosList() {
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const raw = searchParams.get("categoria") || "todos"
  const selected: "todos" | DocumentCategory = raw !== "todos" && isValidCategory(raw) ? raw : "todos"

  const userId = user?.id
  const [state, setState] = useState<ListState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    apiCall("/api/documentos/protected")
      .then((json): ListState => ({ status: "ready", docs: json?.documentos || [] }))
      .catch((err): ListState => ({ status: err instanceof ApiCallError && err.status === 403 ? "forbidden" : "error" }))
      .then((next) => {
        if (!cancelled) setState(next)
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  if (authLoading || (userId && state.status === "loading")) {
    return (
      <div className="container px-4 md:px-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  // Viewers without access get a 404 rather than a hint that the page exists.
  if (!userId || state.status === "forbidden") notFound()

  if (state.status !== "ready") {
    return (
      <RestrictedNotice title="No pudimos cargar los documentos" description="Revisá tu conexión e intentá nuevamente.">
        <Button variant="brandOutline" onClick={retry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </RestrictedNotice>
    )
  }

  const allDocs = state.docs
  const grouped = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, allDocs.filter((d) => d.category === c)])
  ) as Record<DocumentCategory, DocumentoSummary[]>
  const visibleCategories = ALL_CATEGORIES.filter((c) => grouped[c].length > 0)
  const filteredDocs = selected === "todos" ? allDocs : grouped[selected]

  const badgeClass = (active: boolean) =>
    `cursor-pointer text-sm py-1.5 px-3 ${active ? "bg-terracotta hover:bg-terracotta/90" : "hover:bg-amber/10"}`

  return (
    <div className="container px-4 md:px-6">
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/documentos">
          <Badge variant={selected === "todos" ? "default" : "outline"} className={badgeClass(selected === "todos")}>
            Todos ({allDocs.length})
          </Badge>
        </Link>
        {visibleCategories.map((key) => (
          <Link key={key} href={`/documentos?categoria=${key}`}>
            <Badge variant={selected === key ? "default" : "outline"} className={badgeClass(selected === key)}>
              {DOCUMENT_CATEGORIES[key]} ({grouped[key].length})
            </Badge>
          </Link>
        ))}
      </div>

      <div className="mb-6 text-sm text-muted-foreground">
        Mostrando {filteredDocs.length} documento{filteredDocs.length !== 1 ? "s" : ""}
        {selected !== "todos" && ` en ${DOCUMENT_CATEGORIES[selected]}`}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            {selected === "todos"
              ? "No hay documentos disponibles en este momento."
              : "No se encontraron documentos en esta categoría."}
          </p>
          {selected !== "todos" && (
            <Button asChild variant="brandOutline">
              <Link href="/documentos">Ver todos los documentos</Link>
            </Button>
          )}
        </div>
      ) : selected === "todos" ? (
        <div className="space-y-10">
          {visibleCategories.map((key) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-terracotta">{DOCUMENT_CATEGORIES[key]}</h2>
                <Badge variant="secondary" className="text-xs">{grouped[key].length}</Badge>
              </div>
              <DocumentGrid docs={grouped[key]} />
            </div>
          ))}
        </div>
      ) : (
        <DocumentGrid docs={filteredDocs} />
      )}
    </div>
  )
}

function DocumentGrid({ docs }: { docs: DocumentoSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((documento) => (
        <DocumentCard key={documento.id} documento={documento} />
      ))}
    </div>
  )
}

function RestrictedNotice({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="container px-4 md:px-6">
      <div className="mx-auto max-w-lg text-center py-12">
        <Lock className="mx-auto h-16 w-16 text-terracotta/70 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        {children}
      </div>
    </div>
  )
}
