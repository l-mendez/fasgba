import { NextRequest } from 'next/server'
import { getProfesorById, updateProfesor, deleteProfesor } from '@/lib/profesorUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { validateProfesorId, validateUpdateProfesor } from '@/lib/schemas/profesorSchemas'
import { apiSuccess, noContent, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idParam } = await params
    const id = validateProfesorId(idParam)

    const profesor = await getProfesorById(id)

    if (!profesor) {
      return notFoundError('Profesor not found', `No profesor found with ID ${id}`)
    }

    return apiSuccess(profesor)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin(request)

    const { id: idParam } = await params
    const id = validateProfesorId(idParam)

    const existingProfesor = await getProfesorById(id)
    if (!existingProfesor) {
      return notFoundError('Profesor not found', `No profesor found with ID ${id}`)
    }

    const body = await request.json()
    const validatedData = validateUpdateProfesor(body)

    const success = await updateProfesor(id, validatedData)

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

    const { id: idParam } = await params
    const id = validateProfesorId(idParam)

    const existingProfesor = await getProfesorById(id)
    if (!existingProfesor) {
      return notFoundError('Profesor not found', `No profesor found with ID ${id}`)
    }

    const success = await deleteProfesor(id)

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
