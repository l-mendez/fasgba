import { NextRequest } from 'next/server'
import { signOut } from '@/lib/userUtils'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function POST(request: NextRequest) {
  try {
    await signOut()
    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
} 