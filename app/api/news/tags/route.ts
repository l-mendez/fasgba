import { NextRequest } from 'next/server'
import { getAllNewsTags } from '@/lib/newsUtils'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const tags = await getAllNewsTags()
    return apiSuccess({ tags })
  } catch (error) {
    return handleError(error)
  }
} 