import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { ProfesoresTable } from "@/components/profesores-table"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getProfesores() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
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

export default async function ProfesoresAdminPage() {
  const profesores = await getProfesores()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Profesores</h1>
          <p className="text-muted-foreground">
            Gestiona los profesores de ajedrez de FASGBA.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/profesores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Profesor
          </Link>
        </Button>
      </div>

      <ProfesoresTable profesores={profesores} />
    </div>
  )
}
