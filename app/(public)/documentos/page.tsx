import type { Metadata } from "next"
import { Suspense } from "react"

import { DocumentosList } from "@/components/documentos-list"

export const metadata: Metadata = { title: "Documentos" }

// Static shell: no document data is rendered on the server. DocumentosList
// fetches, with the viewer's session, only the documents they may see
// (delegados/admins, plus alumnos for Escuela), and renders the hero once
// access is known.
export const revalidate = false

export default function DocumentosPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px]" />}>
      <DocumentosList />
    </Suspense>
  )
}
