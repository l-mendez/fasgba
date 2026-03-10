import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Return user profile from Supabase Auth
    const profile = {
      id: user.id,
      email: user.email,
      nombre: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      apellido: user.user_metadata?.surname || '',
      telefono: user.user_metadata?.phone || '',
      direccion: user.user_metadata?.address || '',
      fecha_nacimiento: user.user_metadata?.birth_date || '',
      created_at: user.created_at,
      updated_at: user.updated_at
    }
    
    return apiSuccess(profile)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Get the authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    
    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: body.nombre || user.user_metadata?.name,
        surname: body.apellido || user.user_metadata?.surname,
        phone: body.telefono || user.user_metadata?.phone,
        address: body.direccion || user.user_metadata?.address,
        birth_date: body.fecha_nacimiento || user.user_metadata?.birth_date
      }
    })

    if (updateError) {
      throw new Error('Failed to update profile: ' + updateError.message)
    }
    
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 