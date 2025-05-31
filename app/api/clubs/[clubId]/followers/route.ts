import { NextRequest } from 'next/server'
import { followClub, unfollowClub, getClubById, isUserFollowingClub } from '@/lib/clubUtils'
import { requireAuth } from '@/lib/middleware/auth'
import { validateClubId } from '@/lib/schemas/clubSchemas'
import { apiSuccess, created, noContent, handleError, notFoundError, conflictError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

interface RouteParams {
  params: {
    clubId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication to follow clubs
    const user = await requireAuth(request)
    
    const clubId = validateClubId(params.clubId)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    // Get user ID from the database profile
    // Note: We need to get the numeric user ID from the database
    // This would typically come from a user profile lookup
    const userNumericId = parseInt(user.id) || 0 // This is a simplification
    
    // Check if already following
    const alreadyFollowing = await isUserFollowingClub(userNumericId, clubId)
    if (alreadyFollowing) {
      return conflictError(ERROR_MESSAGES.ALREADY_FOLLOWING)
    }
    
    const success = await followClub(userNumericId, clubId)
    
    if (!success) {
      const followError = new Error('Failed to follow club')
      followError.name = 'DatabaseError'
      throw followError
    }
    
    return created({ success: true })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication to unfollow clubs
    const user = await requireAuth(request)
    
    const clubId = validateClubId(params.clubId)
    
    // Check if club exists
    const club = await getClubById(clubId)
    if (!club) {
      return notFoundError(ERROR_MESSAGES.CLUB_NOT_FOUND, `No club found with ID ${clubId}`)
    }
    
    // Get user ID from the database profile
    const userNumericId = parseInt(user.id) || 0 // This is a simplification
    
    // Check if actually following
    const isFollowing = await isUserFollowingClub(userNumericId, clubId)
    if (!isFollowing) {
      return notFoundError(ERROR_MESSAGES.NOT_FOLLOWING, 'You are not following this club')
    }
    
    const success = await unfollowClub(userNumericId, clubId)
    
    if (!success) {
      const unfollowError = new Error('Failed to unfollow club')
      unfollowError.name = 'DatabaseError'
      throw unfollowError
    }
    
    return noContent()
  } catch (error) {
    return handleError(error)
  }
} 