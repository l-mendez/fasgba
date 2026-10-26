import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Users } from "lucide-react"
import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { getClubCached, parseClubId } from "../club-data"

interface PageProps {
  params: Promise<{ id: string }>
}

// Public, read-only team list. Team management lives in /club-admin/equipos.
async function loadClubTeams(rawId: string) {
  const clubId = parseClubId(rawId)
  if (!clubId) return null

  const supabase = await createClient()
  const [club, { data: teams }] = await Promise.all([
    getClubCached(clubId),
    supabase.from("teams").select("id, name").eq("club_id", clubId).order("name"),
  ])
  return club ? { club, teams: teams ?? [] } : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadClubTeams((await params).id)
  return { title: data ? `Equipos · ${data.club.name} | FASGBA` : "Club no encontrado | FASGBA" }
}

export default async function ClubEquiposPage({ params }: PageProps) {
  const data = await loadClubTeams((await params).id)
  if (!data) notFound()
  const { club, teams } = data

  return (
    <section className="w-full pt-8 pb-12 md:pt-12 md:pb-16">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl space-y-4">
          <Link
            href={`/clubes/${club.id}`}
            className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{club.name}</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">Equipos</h1>

          {teams.length === 0 ? (
            <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Sin equipos.</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {teams.map((team) => (
                <li key={team.id} className="flex items-center gap-2 px-4 py-2.5 font-medium">
                  <Users className="h-4 w-4 shrink-0 text-amber" />
                  <span className="min-w-0 break-words">{team.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
