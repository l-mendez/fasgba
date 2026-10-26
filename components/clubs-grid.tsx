"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, MapPin, Phone, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClubFollowButton } from "@/components/club-follow-button"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { getImageUrlNullable } from "@/lib/imageUtils"
import { normalizeForSearch } from "@/lib/countries"
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
    // Accent-insensitive: "lanus" matches "Lanús".
    const term = normalizeForSearch(searchTerm)
    if (!term) return clubs
    return clubs.filter((club) =>
      [club.name, club.address].some((field) => field && normalizeForSearch(field).includes(term))
    )
  }, [clubs, searchTerm])

  // Only show follow buttons once we know the user's follow state, to avoid a
  // flash of "not following" on clubs the user already follows.
  const followReady = isAuthenticated && followedIds !== null

  if (filteredClubs.length === 0) {
    return (
      <div className="text-center py-12 min-h-[400px] flex flex-col justify-center">
        <p className="text-muted-foreground">
          {searchTerm ? "No se encontraron clubes." : "No hay clubes disponibles."}
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  const href = `/clubes/${club.id}`

  // The title link stretches over the whole card; contact links and the
  // follow button sit above it (relative z-10).
  return (
    <div className="group relative flex min-w-0 gap-4 rounded-lg border bg-card p-3 transition-colors hover:border-amber">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
        {imageUrl ? (
          <img src={imageUrl} alt={`Imagen de ${club.name}`} className="h-full w-full object-contain p-1" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <Link
          href={href}
          title={club.name}
          className="block truncate text-base font-semibold text-terracotta after:absolute after:inset-0 group-hover:underline"
        >
          {club.name}
        </Link>
        {club.address && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate" title={club.address}>{club.address}</span>
          </p>
        )}
        {club.telephone && (
          <a
            href={`tel:${club.telephone}`}
            className="relative z-10 flex w-fit max-w-full items-center gap-1.5 text-muted-foreground hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate" title={club.telephone}>{club.telephone}</span>
          </a>
        )}
        {club.mail && (
          <a
            href={`mailto:${club.mail}`}
            className="relative z-10 flex w-fit max-w-full items-center gap-1.5 text-muted-foreground hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" title={club.mail}>{club.mail}</span>
          </a>
        )}
      </div>

      <ClubFollowButton
        clubId={club.id}
        initialIsFollowing={isFollowing}
        isUserAuthenticated={isUserAuthenticated}
        className="relative z-10 shrink-0"
        onFollowChange={onFollowChange}
      />
    </div>
  )
}
