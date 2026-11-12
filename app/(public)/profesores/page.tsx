import { Metadata } from "next"

import { getAllProfesores, type ProfesorWithClub } from "@/lib/profesorUtils"
import { PageHero } from "@/components/page-hero"
import { ProfesorCard } from "@/components/profesor-card"
import { safe } from "@/lib/utils/safe"
import { pageMetadata } from '@/lib/seo'

// Cached indefinitely, purged by revalidateProfesoresCache on mutation.
export const revalidate = false

export const metadata: Metadata = pageMetadata({
  title: 'Clases y profesores de ajedrez',
  description:
    'Clases de ajedrez en la zona sur del Gran Buenos Aires: profesores para aprender ajedrez, con clases presenciales y virtuales.',
  path: '/profesores',
})

async function ProfesoresList() {
  const profesores = await safe(getAllProfesores, [] as ProfesorWithClub[], "Error fetching profesores:")

  if (profesores.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">No hay profesores disponibles.</p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {profesores.map((profesor) => (
        <ProfesorCard key={profesor.id} profesor={profesor} />
      ))}
    </div>
  )
}

export default function ProfesoresPage() {
  return (
    <>
      <PageHero title="Profesores" />
      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <ProfesoresList />
        </div>
      </section>
    </>
  )
}
