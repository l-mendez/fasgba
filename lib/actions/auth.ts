import { createClient } from '@/lib/supabase/server'
import {
  UnauthorizedError,
  ForbiddenError,
  hasPermission,
  type AuthenticatedUser,
} from '@/lib/middleware/auth'

export async function requireAuthAction(): Promise<AuthenticatedUser> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new UnauthorizedError()
  return user as AuthenticatedUser
}

export async function requireAdminAction(): Promise<AuthenticatedUser> {
  const user = await requireAuthAction()
  const isAdmin = await hasPermission('isAdmin', user.id)
  if (!isAdmin) throw new ForbiddenError('Admin access required')
  return user
}

export type ActionError = {
  ok: false
  error: string
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'PAYLOAD_TOO_LARGE' | 'INTERNAL'
}

export function mapErrorToResult(err: unknown): ActionError {
  if (err instanceof UnauthorizedError) return { ok: false, error: err.message, code: 'UNAUTHORIZED' }
  if (err instanceof ForbiddenError)    return { ok: false, error: err.message, code: 'FORBIDDEN' }
  const message = err instanceof Error ? err.message : 'Unknown error'
  console.error('[action error]', err)
  return { ok: false, error: message, code: 'INTERNAL' }
}
