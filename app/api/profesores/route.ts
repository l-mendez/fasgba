import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createProfesor } from '@/lib/profesorUtils'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/profesores - Get all profesores (public)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('profesores')
      .select('*, clubs(name)')
      .order('titulo', { ascending: true })

    if (error) {
      console.error('Error fetching profesores:', error)
      throw new Error('Failed to fetch profesores')
    }

    const profesores = (data || []).map((item: any) => ({
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

    return apiSuccess({ profesores })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/profesores - Create a new profesor (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (adminError || !admin) {
      return unauthorizedError('Admin access required')
    }

    const body = await request.json()

    const profesorData = {
      titulo: body.titulo,
      foto: body.foto || null,
      club_id: body.club_id || null,
      anio_nacimiento: body.anio_nacimiento || null,
      modalidad: body.modalidad || 'presencial',
      zona: body.zona || null,
      biografia: body.biografia || null,
    }

    const newProfesor = await createProfesor(profesorData)

    return apiSuccess(newProfesor, 201)
  } catch (error) {
    return handleError(error)
  }
}
