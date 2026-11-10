import { getAdminClient } from '@/lib/supabase/admin'
import type { ClubRow } from '@/lib/db-types'
import { deleteArbitroImages } from './imageUtils.server'

export interface Arbitro {
  id: number
  name: string
  title: string
  photo: string | null
  club_id: number | null
  birth_year: number | null
  bio: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// Row of `select('*, clubs(name)')`
type ArbitroJoinRow = Arbitro & { clubs: Pick<ClubRow, 'name'> | null }

export interface ArbitroWithClub extends Arbitro {
  club_name: string | null
}

/**
 * Gets all arbitros with optional filtering, joined with club name
 */
export async function getAllArbitros(options: {
  search?: string
} = {}): Promise<ArbitroWithClub[]> {
  const supabase = getAdminClient()
  try {
    let query = supabase
      .from('arbitros')
      .select('*, clubs(name)')
      .order('name', { ascending: true })

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,title.ilike.%${options.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching arbitros:', error)
      throw new Error('Failed to fetch arbitros')
    }

    return (data || []).map((item: ArbitroJoinRow) => ({
      id: item.id,
      name: item.name,
      title: item.title,
      photo: item.photo,
      club_id: item.club_id,
      birth_year: item.birth_year,
      bio: item.bio,
      email: item.email,
      phone: item.phone,
      created_at: item.created_at,
      updated_at: item.updated_at,
      club_name: item.clubs?.name || null,
    }))
  } catch (error) {
    console.error('Error in getAllArbitros:', error)
    throw error
  }
}

/**
 * Gets an arbitro by ID with club name
 */
export async function getArbitroById(arbitroId: number): Promise<ArbitroWithClub | null> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('arbitros')
    .select('*, clubs(name)')
    .eq('id', arbitroId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching arbitro:', error)
    throw new Error('Failed to fetch arbitro')
  }

  const joined: ArbitroJoinRow = data
  return {
    id: data.id,
    name: data.name,
    title: data.title,
    photo: data.photo,
    club_id: data.club_id,
    birth_year: data.birth_year,
    bio: data.bio,
    email: data.email,
    phone: data.phone,
    created_at: data.created_at,
    updated_at: data.updated_at,
    club_name: joined.clubs?.name || null,
  }
}

/**
 * Creates a new arbitro
 */
export async function createArbitro(arbitroData: Omit<Arbitro, 'id' | 'created_at' | 'updated_at'>): Promise<Arbitro> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('arbitros')
    .insert(arbitroData)
    .select()
    .single()

  if (error) {
    console.error('Error creating arbitro:', error)
    throw new Error('Failed to create arbitro')
  }

  return data
}

/**
 * Updates an arbitro
 */
export async function updateArbitro(arbitroId: number, updates: Partial<Omit<Arbitro, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('arbitros')
    .update(updates)
    .eq('id', arbitroId)

  if (error) {
    console.error('Error updating arbitro:', error)
    throw new Error('Failed to update arbitro')
  }

  return true
}

/**
 * Deletes an arbitro and its images
 */
export async function deleteArbitro(arbitroId: number): Promise<boolean> {
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('arbitros')
    .delete()
    .eq('id', arbitroId)

  if (error) {
    console.error('Error deleting arbitro:', error)
    throw new Error('Failed to delete arbitro')
  }

  await deleteArbitroImages(arbitroId)

  return true
}
