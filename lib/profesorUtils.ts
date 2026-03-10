import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface Profesor {
  id: number
  titulo: string
  foto: string | null
  club_id: number | null
  anio_nacimiento: number | null
  modalidad: 'presencial' | 'virtual' | 'ambos'
  zona: string | null
  biografia: string | null
}

export interface ProfesorWithClub extends Profesor {
  club_name: string | null
}

/**
 * Gets all profesores with club name
 */
export async function getAllProfesores(options: {
  search?: string
  modalidad?: string
} = {}): Promise<ProfesorWithClub[]> {
  try {
    let query = supabase
      .from('profesores')
      .select('*, clubs(name)')
      .order('titulo', { ascending: true })

    if (options.search) {
      query = query.ilike('titulo', `%${options.search}%`)
    }

    if (options.modalidad && ['presencial', 'virtual', 'ambos'].includes(options.modalidad)) {
      query = query.eq('modalidad', options.modalidad)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching profesores:', error)
      throw new Error('Failed to fetch profesores')
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
      club_name: item.clubs?.name || null,
    }))
  } catch (error) {
    console.error('Error in getAllProfesores:', error)
    throw error
  }
}

/**
 * Gets a profesor by ID with club name
 */
export async function getProfesorById(id: number): Promise<ProfesorWithClub | null> {
  const { data, error } = await supabase
    .from('profesores')
    .select('*, clubs(name)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching profesor:', error)
    throw new Error('Failed to fetch profesor')
  }

  return {
    id: data.id,
    titulo: data.titulo,
    foto: data.foto,
    club_id: data.club_id,
    anio_nacimiento: data.anio_nacimiento,
    modalidad: data.modalidad,
    zona: data.zona,
    biografia: data.biografia,
    club_name: (data as any).clubs?.name || null,
  }
}

/**
 * Creates a new profesor
 */
export async function createProfesor(profesorData: Omit<Profesor, 'id'>): Promise<Profesor> {
  const { data, error } = await supabase
    .from('profesores')
    .insert(profesorData)
    .select()
    .single()

  if (error) {
    console.error('Error creating profesor:', error)
    throw new Error('Failed to create profesor')
  }

  return data
}

/**
 * Updates a profesor
 */
export async function updateProfesor(id: number, updates: Partial<Omit<Profesor, 'id'>>): Promise<boolean> {
  const { error } = await supabase
    .from('profesores')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating profesor:', error)
    throw new Error('Failed to update profesor')
  }

  return true
}

/**
 * Deletes a profesor and its images
 */
export async function deleteProfesor(id: number): Promise<boolean> {
  // Delete foto from storage if exists
  const profesor = await getProfesorById(id)
  if (profesor?.foto) {
    try {
      await supabase.storage.from('images').remove([profesor.foto])
    } catch (err) {
      console.warn('Failed to delete profesor image:', err)
    }
  }

  const { error } = await supabase
    .from('profesores')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting profesor:', error)
    throw new Error('Failed to delete profesor')
  }

  return true
}
