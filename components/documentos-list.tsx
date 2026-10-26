"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"
import { RefreshCw, Search } from "lucide-react"

import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentCard } from "@/components/documentos/document-card"
import { useAuth } from "@/hooks/useAuth"
import { apiCall, ApiCallError } from "@/lib/utils/apiClient"
import {
  ALL_CATEGORIES,
  DOCUMENT_CATEGORIES,
  formatArgentinaDate,
  isValidCategory,
  type DocumentCategory,
  type DocumentoSummary,
} from "@/lib/documentosUtils"

const SECTION = "w-full pt-6 pb-12 md:pt-8 md:pb-16"

// Case- and accent-insensitive text for search.
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")

type ListState =
  | { status: "loading" | "forbidden" | "error" }
  | { status: "ready"; docs: DocumentoSummary[] }

// Client island: the /documentos page is a static shell. Documents are fetched
// here with the viewer's session and the server decides what they may see, so
// no metadata reaches anonymous users or the prerendered HTML. Filtering works
// via category chips and ?categoria=, plus a local search on name and date.
// The hero only renders once access is known, so viewers without access never
// see the page title before the 404.
export function DocumentosList() {
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const raw = searchParams.get("categoria") || "todos"
  const selected: "todos" | DocumentCategory = raw !== "todos" && isValidCategory(raw) ? raw : "todos"

  const userId = user?.id
  const [state, setState] = useState<ListState>({ status: "loading" })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState("")
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
      <section className={SECTION}>
        <div className="container grid gap-4 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </section>
    )
  }

  // Viewers without access get a 404 rather than a hint that the page exists.
  if (!userId || state.status === "forbidden") notFound()

  if (state.status !== "ready") {
    return (
      <>
        <PageHero title="Documentos" />
        <section className={SECTION}>
          <div className="container px-4 py-12 text-center md:px-6">
            <p className="mb-4 text-muted-foreground">No pudimos cargar los documentos.</p>
            <Button variant="brandOutline" onClick={retry}>
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </section>
      </>
    )
  }

  const allDocs = state.docs
  const grouped = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, allDocs.filter((d) => d.category === c)])
  ) as Record<DocumentCategory, DocumentoSummary[]>
  const visibleCategories = ALL_CATEGORIES.filter((c) => grouped[c].length > 0)
  const terms = normalize(query.trim())
  const matches = (d: DocumentoSummary) =>
    normalize(`${d.name} ${formatArgentinaDate(d.created_at)} ${d.created_at.slice(0, 10)}`).includes(terms)
  const categoryDocs = selected === "todos" ? allDocs : grouped[selected]
  const filteredDocs = terms ? categoryDocs.filter(matches) : categoryDocs

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
    <>
      <PageHero title="Documentos" />
      <section className={SECTION}>
        <div className="container px-4 md:px-6">
          {allDocs.length > 0 && (
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o fecha"
                aria-label="Buscar documentos"
                className="pl-9"
              />
            </div>
          )}

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
                {terms
                  ? "Ningún documento coincide con la búsqueda."
                  : selected === "todos"
                    ? "No hay documentos disponibles."
                    : "No hay documentos en esta categoría."}
              </p>
              {selected !== "todos" && !terms && (
                <Button asChild variant="brandOutline">
                  <Link href="/documentos">Ver todos</Link>
                </Button>
              )}
            </div>
          ) : selected === "todos" && !terms ? (
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
      </section>
    </>
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
