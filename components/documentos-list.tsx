"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FolderOpen, Lock, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentCard, type ViewerDocumento } from "@/components/documentos/document-card"
import { useAuth } from "@/hooks/useAuth"
import { apiCall } from "@/lib/utils/apiClient"
import {
  ALL_CATEGORIES,
  DOCUMENT_CATEGORIES,
  getViewableCategories,
  isValidCategory,
  type DocumentCategory,
} from "@/lib/documentosUtils"

const ACCESS_HINT =
  "Los documentos están disponibles para delegados de club y administradores. Los alumnos de la escuela acceden a la sección Escuela."

// Client island: the /documentos page is a static shell. Every document is
// fetched here with the viewer's token, so metadata never reaches anonymous
// users or the prerendered HTML. Filtering works via badges and ?categoria=.
export function DocumentosList() {
  const { user, isLoading: authLoading, isAuthenticated, isAdmin, isClubAdmin, isAlumno } = useAuth()
  const searchParams = useSearchParams()
  const raw = searchParams.get("categoria") || "todos"
  const selected: "todos" | DocumentCategory = raw !== "todos" && isValidCategory(raw) ? raw : "todos"

  const canView = getViewableCategories({ isAdmin, isClubAdmin, isAlumno }).length > 0
  const userId = !authLoading && isAuthenticated && canView ? user?.id : undefined

  // Keyed by user so a different sign-in never shows the previous viewer's list.
  const [loaded, setLoaded] = useState<{ userId: string; docs: ViewerDocumento[] } | null>(null)
  const documentos = loaded && loaded.userId === userId ? loaded.docs : null

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    apiCall("/api/documentos/protected")
      .then((json) => ({ userId, docs: (json?.documentos || []) as ViewerDocumento[] }))
      .catch(() => ({ userId, docs: [] as ViewerDocumento[] }))
      .then((result) => {
        if (!cancelled) setLoaded(result)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const grouped = useMemo(() => {
    const map = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, [] as ViewerDocumento[]])) as Record<DocumentCategory, ViewerDocumento[]>
    for (const doc of documentos || []) map[doc.category]?.push(doc)
    return map
  }, [documentos])

  if (authLoading || (userId && documentos === null)) {
    return (
      <div className="container px-4 md:px-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse h-28 bg-muted rounded-md" />
        ))}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <RestrictedNotice
        title="Acceso restringido"
        description={`Iniciá sesión para ver los documentos. ${ACCESS_HINT}`}
        action={
          <Button asChild variant="brand">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Link>
          </Button>
        }
      />
    )
  }

  if (!canView) {
    return <RestrictedNotice title="Tu cuenta no tiene acceso a los documentos" description={ACCESS_HINT} />
  }

  const allDocs = documentos || []
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
            <CategoryGrid key={key} category={key} docs={grouped[key]} />
          ))}
        </div>
      ) : (
        <DocumentGrid docs={filteredDocs} />
      )}
    </div>
  )
}

function CategoryGrid({ category, docs }: { category: DocumentCategory; docs: ViewerDocumento[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-terracotta">{DOCUMENT_CATEGORIES[category]}</h2>
        <Badge variant="secondary" className="text-xs">{docs.length}</Badge>
      </div>
      <DocumentGrid docs={docs} />
    </div>
  )
}

function DocumentGrid({ docs }: { docs: ViewerDocumento[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((documento) => (
        <DocumentCard key={documento.id} documento={documento} />
      ))}
    </div>
  )
}

function RestrictedNotice({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="container px-4 md:px-6">
      <div className="mx-auto max-w-lg text-center py-12">
        <Lock className="mx-auto h-16 w-16 text-terracotta/70 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action}
      </div>
    </div>
  )
}
