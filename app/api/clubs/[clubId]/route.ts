import { NextRequest } from 'next/server'
import { getClubById, getClubWithStats, updateClub, deleteClub } from '@/lib/clubUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { validateClubId, validateUpdateClub, validateClubQuery } from '@/lib/schemas/clubSchemas'
import { apiSuccess, noContent, handleError, notFoundError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    clubId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const clubId = validateClubId(params.clubId)
    const { searchParams } = new URL(request.url)
    const queryParams = validateClubQuery(searchParams)
    
    let club
    
    // Handle include=stats
    if (queryParams.include === 'stats') {
      club = await getClubWithStats(clubId)
    } else {
      club = await getClubById(clubId)
    }
    
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    return apiSuccess(club)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    
    const clubId = validateClubId(params.clubId)
    
    // Check if club exists
    const existingClub = await getClubById(clubId)
    if (!existingClub) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const body = await request.json()
    const validatedData = validateUpdateClub(body)
    
    const success = await updateClub(clubId, validatedData)
    
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
    // Require admin authentication
    await requireAdmin(request)
    
    const clubId = validateClubId(params.clubId)
    
    // Check if club exists
    const existingClub = await getClubById(clubId)
    if (!existingClub) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    const success = await deleteClub(clubId)
    
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