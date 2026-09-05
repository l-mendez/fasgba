import { Suspense } from "react"

import { DocumentosList } from "@/components/documentos-list"
import { PageHero } from "@/components/page-hero"

// Static shell: no document data is rendered on the server. DocumentosList
// fetches, with the viewer's session, only the documents they may see
// (delegados/admins, plus alumnos for Escuela).
export const revalidate = false

export default function DocumentosPage() {
  return (
    <>
      <PageHero
        title="Documentos"
        subtitle="Documentos oficiales de la Federación. Acceso para delegados de club, administradores y alumnos de la escuela"
      />

      <section className="w-full py-12 md:py-24 lg:py-32">
        <Suspense fallback={<div className="container px-4 md:px-6 min-h-[400px]" />}>
          <DocumentosList />
        </Suspense>
      </section>
    </>
  )
}
