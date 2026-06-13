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
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  // Notifies the parent of the new follow state so it can stay the source of
  // truth (e.g. survive remounts when a list re-filters).
  onFollowChange?: (clubId: number, isFollowing: boolean) => void
}

export function ClubFollowButton({
  clubId,
  initialIsFollowing,
  isUserAuthenticated,
  className,
  size = "icon",
  onFollowChange
}: ClubFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // Update follow state when initialIsFollowing prop changes
  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  // Don't render anything if user is not authenticated
  if (!isUserAuthenticated) {
    return null
  }

  const handleToggleFollow = async () => {
    if (!user || isLoading) return
    
    setIsLoading(true)
    const previousState = isFollowing
    const newFollowState = !isFollowing
    
    // Optimistic UI update
    setIsFollowing(newFollowState)
    onFollowChange?.(clubId, newFollowState)

    try {
      if (previousState) {
        await unfollowClub(clubId, user.id)
      } else {
        await followClub(clubId, user.id)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState)
      onFollowChange?.(clubId, previousState)
      console.error('Error toggling follow status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={isFollowing ? "default" : "outline"}
      size={size}
      className={className}
      onClick={handleToggleFollow}
      disabled={isLoading || !user}
    >
      <Heart className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} ${size !== "icon" ? "mr-2" : ""} ${isFollowing ? 'fill-current' : ''}`} />
      {size !== "icon" && (
        <span>{isFollowing ? 'Siguiendo' : 'Seguir Club'}</span>
      )}
      {size === "icon" && (
        <span className="sr-only">
          {isFollowing ? 'Dejar de seguir' : 'Seguir'} club
        </span>
      )}
    </Button>
  )
} 