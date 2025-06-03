"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { followClub, unfollowClub } from "@/lib/clubUtils"
import { useAuth } from "@/hooks/useAuth"

interface ClubFollowButtonProps {
  clubId: number
  initialIsFollowing: boolean
  isUserAuthenticated: boolean
}

export function ClubFollowButton({ clubId, initialIsFollowing, isUserAuthenticated }: ClubFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything if user is not authenticated
  if (!isUserAuthenticated) {
    return null
  }

  const handleToggleFollow = async () => {
    if (!user) return
    
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
      disabled={!mounted || !user}
    >
      <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
      <span className="sr-only">
        {isFollowing ? 'Dejar de seguir' : 'Seguir'} club
      </span>
    </Button>
  )
} 