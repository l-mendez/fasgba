import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { ProfesoresTable } from "@/components/profesores-table"
import { requireAdminAction } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = 'force-dynamic'

async function getProfesores() {
  await requireAdminAction()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profesores')
    .select('*, clubs(name)')
    .order('titulo', { ascending: true })

  if (error) {
    console.error('Error fetching profesores:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    titulo: item.titulo,
    foto: item.foto,
    club_id: item.club_id,
    anio_nacimiento: item.anio_nacimiento,
    modalidad: item.modalidad,
    zona: item.zona,
    biografia: item.biografia,
    email: item.email,
    telefono: item.telefono,
    tarifa_horaria: item.tarifa_horaria,
    club_name: item.clubs?.name || null,
  }))
}

export default function ProfesoresAdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Profesores"
        subtitle="Gestiona los profesores de ajedrez de FASGBA."
        action={
          <Button asChild>
            <Link href="/admin/profesores/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Profesor
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<AdminContentSkeleton rows={5} filters={false} />}>
        <ProfesoresContent />
      </Suspense>
    </div>
  )
}

async function ProfesoresContent() {
  const profesores = await getProfesores()

  return <ProfesoresTable profesores={profesores} />
}
