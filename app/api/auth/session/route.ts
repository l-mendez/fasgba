import { NextRequest } from 'next/server'
import { getSession } from '@/lib/userUtils'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    return apiSuccess(session)
  } catch (error) {
    return handleError(error)
  }
} 