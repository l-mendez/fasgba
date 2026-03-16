import { NextRequest } from 'next/server'
import { deleteArbitroImage } from '@/lib/imageUtils.server'
import { updateArbitro, getArbitroById } from '@/lib/arbitroUtils'
import { validateArbitroId } from '@/lib/schemas/arbitroSchemas'
import { requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    arbitroId: string
  }>
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

    if (!existingArbitro.photo) {
      return handleError(new Error('Arbitro has no image to delete'))
    }

    await deleteArbitroImage(existingArbitro.photo)
    await updateArbitro(arbitroId, { photo: null })

    return apiSuccess({
      message: 'Arbitro image deleted successfully',
      deletedImagePath: existingArbitro.photo
    })
  } catch (error) {
    return handleError(error)
  }
}
