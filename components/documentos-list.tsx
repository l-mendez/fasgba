"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
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
// via category chips and ?categoria=.
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
      <div className="container grid gap-4 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    )
  }

  // Viewers without access get a 404 rather than a hint that the page exists.
  if (!userId || state.status === "forbidden") notFound()

  if (state.status !== "ready") {
    return (
      <div className="container px-4 py-12 text-center md:px-6">
        <p className="mb-4 text-muted-foreground">No pudimos cargar los documentos.</p>
        <Button variant="brandOutline" onClick={retry}>
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  const allDocs = state.docs
  const grouped = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, allDocs.filter((d) => d.category === c)])
  ) as Record<DocumentCategory, DocumentoSummary[]>
  const visibleCategories = ALL_CATEGORIES.filter((c) => grouped[c].length > 0)
  const filteredDocs = selected === "todos" ? allDocs : grouped[selected]

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-terracotta bg-terracotta text-white"
          : "text-muted-foreground hover:border-amber hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="container px-4 md:px-6">
      {allDocs.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {chip("/documentos", `Todos (${allDocs.length})`, selected === "todos")}
          {visibleCategories.map((key) =>
            chip(`/documentos?categoria=${key}`, `${DOCUMENT_CATEGORIES[key]} (${grouped[key].length})`, selected === key)
          )}
        </div>
      )}

      {filteredDocs.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            {selected === "todos" ? "No hay documentos disponibles." : "No hay documentos en esta categoría."}
          </p>
          {selected !== "todos" && (
            <Button asChild variant="brandOutline">
              <Link href="/documentos">Ver todos</Link>
            </Button>
          )}
        </div>
      ) : selected === "todos" ? (
        <div className="space-y-8">
          {visibleCategories.map((key) => (
            <div key={key}>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-terracotta">{DOCUMENT_CATEGORIES[key]}</h2>
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
