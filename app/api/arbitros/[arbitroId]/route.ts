import { NextRequest } from 'next/server'
import { getArbitroById, updateArbitro, deleteArbitro } from '@/lib/arbitroUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { validateArbitroId, validateUpdateArbitro } from '@/lib/schemas/arbitroSchemas'
import { apiSuccess, noContent, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    arbitroId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { arbitroId: arbitroIdParam } = await params
    const arbitroId = validateArbitroId(arbitroIdParam)

    const arbitro = await getArbitroById(arbitroId)

    if (!arbitro) {
      return notFoundError(ERROR_MESSAGES.ARBITRO_NOT_FOUND, `No arbitro found with ID ${arbitroId}`)
    }

    return apiSuccess(arbitro)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { arbitroId: arbitroIdParam } = await params
    const arbitroId = validateArbitroId(arbitroIdParam)

    const existingArbitro = await getArbitroById(arbitroId)
    if (!existingArbitro) {
      return notFoundError(ERROR_MESSAGES.ARBITRO_NOT_FOUND, `No arbitro found with ID ${arbitroId}`)
    }

    const body = await request.json()
    const validatedData = validateUpdateArbitro(body)

    const success = await updateArbitro(arbitroId, validatedData)

    if (!success) {
      const updateError = new Error(ERROR_MESSAGES.UPDATE_FAILED)
      updateError.name = 'DatabaseError'
      throw updateError
    }

    return apiSuccess({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { arbitroId: arbitroIdParam } = await params
    const arbitroId = validateArbitroId(arbitroIdParam)

    const existingArbitro = await getArbitroById(arbitroId)
    if (!existingArbitro) {
      return notFoundError(ERROR_MESSAGES.ARBITRO_NOT_FOUND, `No arbitro found with ID ${arbitroId}`)
    }

    const success = await deleteArbitro(arbitroId)

    if (!success) {
      const deleteError = new Error(ERROR_MESSAGES.DELETION_FAILED)
      deleteError.name = 'DatabaseError'
      throw deleteError
    }

    return noContent()
  } catch (error) {
    return handleError(error)
  }
}
