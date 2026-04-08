import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function PUT(request: NextRequest) {
  try {
    const limited = rateLimit(request, 10, 60_000)
    if (limited) return limited

    await requireAdmin(request)

    const { userId, metadata, email } = await request.json()

    if (!userId) {
      return validationError('User ID is required')
    }

    const supabase = createAdminClient()

    if (metadata) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      })
      if (error) {
        throw new Error('Failed to update user metadata')
      }
    }

    if (email) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { email })
      if (error) {
        throw new Error('Failed to update user email')
      }
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
