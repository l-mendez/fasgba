"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, MapPin, Phone, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ClubFollowButton } from "@/components/club-follow-button"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { getImageUrlNullable } from "@/lib/imageUtils"
import type { Club } from "@/lib/clubUtils"

export function ClubsGrid({ clubs }: { clubs: Club[] }) {
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get("search")?.trim() ?? ""
  const { isAuthenticated } = useAuth()
  const [followedIds, setFollowedIds] = useState<Set<number> | null>(null)

  // Load the user's followed clubs once (single batched request), so each card
  // can show the correct follow state without a per-club call.
  useEffect(() => {
    // While logged out, follow buttons are hidden (see followReady), so any
    // previously loaded set is never shown — no need to reset it here.
    if (!isAuthenticated) return

    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await createClient().auth.getSession()
        if (!session) return
        const res = await fetch("/api/users/me/followed-clubs", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) throw new Error("Failed to load followed clubs")
        const { clubIds } = await res.json()
        if (!cancelled) setFollowedIds(new Set<number>(clubIds))
      } catch (error) {
        console.error("Error loading followed clubs:", error)
        if (!cancelled) setFollowedIds(new Set())
      }
    })()

    return () => { cancelled = true }
  }, [isAuthenticated])

  // Keep the parent set in sync after a toggle so the follow state survives
  // card remounts (e.g. when the list re-filters on search).
  const handleFollowChange = useCallback((clubId: number, isFollowing: boolean) => {
    setFollowedIds((prev) => {
      const next = new Set(prev ?? [])
      if (isFollowing) next.add(clubId)
      else next.delete(clubId)
      return next
    })
  }, [])

  const filteredClubs = useMemo(() => {
    const term = searchTerm.toLowerCase()
    if (!term) return clubs
    return clubs.filter((club) => club.name.toLowerCase().includes(term))
  }, [clubs, searchTerm])

  // Only show follow buttons once we know the user's follow state, to avoid a
  // flash of "not following" on clubs the user already follows.
  const followReady = isAuthenticated && followedIds !== null

  if (filteredClubs.length === 0) {
    return (
      <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {searchTerm ? "No se encontraron clubes" : "No hay clubes disponibles"}
        </h3>
        <p className="text-muted-foreground">
          {searchTerm ? "Intenta con otros términos de búsqueda." : "Vuelve más tarde para ver los clubes afiliados."}
        </p>
        {searchTerm && (
          <Button asChild variant="outline" className="mt-4 mx-auto">
            <Link href="/clubes">Ver todos los clubes</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[400px]">
      {filteredClubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          isUserAuthenticated={followReady}
          isFollowing={followedIds?.has(club.id) ?? false}
          onFollowChange={handleFollowChange}
        />
      ))}
    </div>
  )
}

function ClubCard({
  club,
  isUserAuthenticated,
  isFollowing,
  onFollowChange,
}: {
  club: Club
  isUserAuthenticated: boolean
  isFollowing: boolean
  onFollowChange: (clubId: number, isFollowing: boolean) => void
}) {
  const imageUrl = getImageUrlNullable(club.image)

  return (
    <Card className="flex flex-col group hover:border-amber transition-colors">
      {imageUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={`Imagen de ${club.name}`}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-muted rounded-t-lg flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      <CardHeader>
        <CardTitle>
          <Link href={`/clubes/${club.id}`} className="text-terracotta hover:underline">
            {club.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {club.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm">{club.address}</span>
            </div>
          )}
          {club.telephone && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm">{club.telephone}</span>
            </div>
          )}
          {club.mail && (
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm">{club.mail}</span>
            </div>
          )}
          {club.schedule && (
            <div>
              <h4 className="text-sm font-medium mb-1">Horarios de actividad:</h4>
              <p className="text-sm text-muted-foreground">{club.schedule}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild className="w-full">
          <Link href={`/clubes/${club.id}`}>Ver Detalle</Link>
        </Button>
        <ClubFollowButton
          clubId={club.id}
          initialIsFollowing={isFollowing}
          isUserAuthenticated={isUserAuthenticated}
          onFollowChange={onFollowChange}
        />
      </CardFooter>
    </Card>
  )
}
