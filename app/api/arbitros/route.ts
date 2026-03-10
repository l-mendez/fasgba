import { NextRequest } from 'next/server'
import { getAllArbitros, createArbitro } from '@/lib/arbitroUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { validateCreateArbitro } from '@/lib/schemas/arbitroSchemas'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

    const arbitros = await getAllArbitros({ search })

    return apiSuccess({ arbitros })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)

    const body = await request.json()
    const validatedData = validateCreateArbitro(body)

    const newArbitro = await createArbitro({
      name: validatedData.name,
      title: validatedData.title,
      photo: validatedData.photo || null,
      club_id: validatedData.club_id || null,
      birth_year: validatedData.birth_year || null,
      bio: validatedData.bio || null,
    })

    return apiSuccess(newArbitro, 201)
  } catch (error) {
    return handleError(error)
  }
}
