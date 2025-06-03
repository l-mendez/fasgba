"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { followClub, unfollowClub } from "@/lib/clubUtils"
import { useAuth } from "@/hooks/useAuth"

interface ClubFollowButtonProps {
  clubId: number
  initialIsFollowing: boolean
}

export function ClubFollowButton({ clubId, initialIsFollowing }: ClubFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const handleToggleFollow = async () => {
    const newFollowState = !isFollowing
    
    // Optimistic UI update
    setIsFollowing(newFollowState)

    try {
      if (isFollowing) {
        await unfollowClub(clubId, user.id)
      } else {
        await followClub(clubId, user.id)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(isFollowing)
      console.error('Error toggling follow status:', error)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className={`border-amber text-amber-dark hover:bg-amber/10 ${
        isFollowing ? 'bg-amber/10' : ''
      }`}
      onClick={handleToggleFollow}
    >
      <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
      <span className="sr-only">
        {isFollowing ? 'Dejar de seguir' : 'Seguir'} club
      </span>
    </Button>
  )
} 