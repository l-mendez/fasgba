import Link from "next/link"
import { Plus, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { ArbitrosTable } from "@/components/arbitros-table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ArbitroRow {
  id: number
  name: string
  title: string
  photo: string | null
  club_id: number | null
  club_name: string | null
  birth_year: number | null
  bio: string | null
}

async function fetchArbitros(): Promise<ArbitroRow[]> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('No tienes acceso a esta información')
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !adminData) {
      throw new Error('No tienes permisos de administrador')
    }

    const { data, error } = await supabase
      .from('arbitros')
      .select('*, clubs(name)')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching arbitros:', error)
      throw new Error('Error al obtener los árbitros')
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      title: item.title,
      photo: item.photo,
      club_id: item.club_id,
      club_name: item.clubs?.name || null,
      birth_year: item.birth_year,
      bio: item.bio,
    }))
  } catch (error) {
    console.error('Error fetching arbitros:', error)
    throw error
  }
}

export default async function AdminArbitrosPage() {
  let arbitros: ArbitroRow[] = []
  let error: string | null = null

  try {
    arbitros = await fetchArbitros()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar los árbitros"
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8 pb-16 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta">Árbitros</h1>
          <p className="text-muted-foreground">Gestiona los árbitros de FASGBA.</p>
        </div>
        <Button asChild>
          <Link href="/admin/arbitros/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Árbitro
          </Link>
        </Button>
      </div>

      <ArbitrosTable initialArbitros={arbitros} />
    </div>
  )
}
