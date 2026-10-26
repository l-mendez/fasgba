import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/middleware/auth'
import { validateUpdatePassword } from '@/lib/schemas/userSchemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { currentPassword, newPassword } = validateUpdatePassword(body)

    // Verify current password using a temporary anon client
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError) {
      return validationError(ERROR_MESSAGES.INVALID_CURRENT_PASSWORD)
    }

    // Update password using admin client
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      const err = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      err.name = 'DatabaseError'
      throw err
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
