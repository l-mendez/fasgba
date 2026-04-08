import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, 10, 60_000)
    if (limited) return limited

    await requireAdmin(request)

    const { auth_id } = await request.json()

    if (!auth_id) {
      return validationError('auth_id is required')
    }

    const supabase = createAdminClient()

    // Check if already admin
    const { data: existing } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', auth_id)
      .single()

    if (existing) {
      return apiSuccess({ message: 'User is already an admin' })
    }

    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ auth_id }])

    if (insertError) {
      throw new Error(`Failed to add admin: ${insertError.message}`)
    }

    return apiSuccess({ message: 'User successfully added as admin' })
  } catch (error) {
    return handleError(error)
  }
}
