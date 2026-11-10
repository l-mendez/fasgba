import { getAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

export async function PUT(request: NextRequest) {
  const supabase = getAdminClient()
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

    const body = await request.json()
    const notifications = body.notifications || {}

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        notifications,
      }
    })

    if (updateError) {
      throw new Error('Failed to update notifications: ' + updateError.message)
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}



