import { NextRequest } from 'next/server'
import { isAuthenticated } from '@/lib/userUtils'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    return apiSuccess({ isAuthenticated: authenticated })
  } catch (error) {
    return handleError(error)
  }
} 