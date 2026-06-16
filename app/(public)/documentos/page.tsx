import { Suspense } from "react"
import { unstable_cache } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { DocumentosList, type PublicDocumento } from "@/components/documentos-list"

// ISR: Revalidate every 5 minutes (300 seconds). Only PUBLIC documents are
// fetched/shipped here so the static output never contains protected
// (escuela/otros) metadata. Protected categories are fetched client-side, with
// auth, inside ProtectedSection.
export const revalidate = 300

const PUBLIC_CATEGORIES = ["reglamentos", "actas", "minutas"]

// Cached fetcher — admin client (no cookies), scoped to public categories only.
const getCachedPublicDocumentos = unstable_cache(
  async (): Promise<PublicDocumento[]> => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("documentos")
      .select("id, name, category, file_path, file_size, created_at")
      .in("category", PUBLIC_CATEGORIES)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching documentos:", error)
      return []
    }

    return (data || []) as PublicDocumento[]
  },
  ["documentos-public-list"],
  { revalidate: 300, tags: ["documentos"] }
)

async function fetchPublicDocumentos(): Promise<PublicDocumento[]> {
  try {
    return await getCachedPublicDocumentos()
  } catch (error) {
    console.error("Error fetching documentos:", error)
    return []
  }
}

export default async function DocumentosPage() {
  const publicDocs = await fetchPublicDocumentos()

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <Suspense fallback={<div className="container px-4 md:px-6 min-h-[400px]" />}>
          <DocumentosList publicDocs={publicDocs} />
        </Suspense>
      </section>
    </>
  )
}
