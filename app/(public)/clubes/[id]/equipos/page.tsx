import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Trophy, Users } from "lucide-react"
import type { Metadata } from "next"

import { JsonLd } from "@/components/json-ld"
import { createClient } from "@/lib/supabase/server"
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo"
import { getClubCached, parseClubId } from "../club-data"

interface PageProps {
  params: Promise<{ id: string }>
}

// PostgREST embeds many-to-one relations as objects, but the inferred type is an array.
const one = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value)

// Public, read-only team list with the tournaments each team played.
// Team management lives in /club-admin/equipos.
async function loadClubTeams(rawId: string) {
  const clubId = parseClubId(rawId)
  if (!clubId) return null

  const supabase = await createClient()
  const [club, { data }] = await Promise.all([
    getClubCached(clubId),
    supabase
      .from("teams")
      .select("id, name, tournament_teams(tournament:tournaments(id, title))")
      .eq("club_id", clubId)
      .order("name"),
  ])
  if (!club) return null

  const teams = (data ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    tournaments: team.tournament_teams
      .map((entry) => one(entry.tournament))
      .filter((tournament) => tournament != null)
      .sort((a, b) => b.id - a.id),
  }))
  return { club, teams }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await loadClubTeams((await params).id)
  if (!data) return { title: "Club no encontrado" }
  const { club, teams } = data
  const metadata = pageMetadata({
    title: `Equipos de ajedrez de ${club.name}`,
    description: `Equipos de ajedrez de ${club.name} y los torneos por equipos de FASGBA en los que participaron.`,
    path: `/clubes/${club.id}/equipos`,
  })
  // Same rule as the club page (non-affiliated clubs stay out of the index),
  // plus clubs without teams, whose page would be empty.
  return club.affiliated && teams.length > 0 ? metadata : { ...metadata, robots: { index: false, follow: true } }
}

export default async function ClubEquiposPage({ params }: PageProps) {
  const data = await loadClubTeams((await params).id)
  if (!data) notFound()
  const { club, teams } = data

  return (
    <section className="w-full pt-8 pb-12 md:pt-12 md:pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Clubes", path: "/clubes" },
          { name: club.name, path: `/clubes/${club.id}` },
          { name: "Equipos", path: `/clubes/${club.id}/equipos` },
        ])}
      />
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl space-y-4">
          <Link
            href={`/clubes/${club.id}`}
            className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{club.name}</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">
            Equipos de {club.name}
          </h1>

          {teams.length === 0 ? (
            <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Sin equipos.</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {teams.map((team) => (
                <li key={team.id} className="space-y-1.5 px-4 py-3">
                  <h2 className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 shrink-0 text-amber" />
                    <span className="min-w-0 break-words">{team.name}</span>
                  </h2>
                  {team.tournaments.length > 0 && (
                    <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
                      {team.tournaments.map((tournament) => (
                        <li key={tournament.id} className="flex items-start gap-1.5">
                          <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <Link
                            href={`/torneos/${tournament.id}`}
                            className="min-w-0 break-words underline-offset-4 hover:text-foreground hover:underline"
                          >
                            {tournament.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
