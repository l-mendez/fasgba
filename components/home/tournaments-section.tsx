import { Trophy } from "lucide-react"

import { ScrollReveal } from "@/components/scroll-reveal"
import type { HomeTournament } from "@/lib/homeUtils"
import { HomeSectionHeader } from "./section-header"
import { TournamentCard } from "./tournament-card"

export function HomeTournamentsSection({ tournaments }: { tournaments: HomeTournament[] }) {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <ScrollReveal>
          <HomeSectionHeader
            icon={Trophy}
            title="Torneos"
            subtitle="Torneos en curso y próximos organizados por FASGBA"
            action={{ href: "/torneos", label: "Ver todos" }}
          />
        </ScrollReveal>

        {tournaments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament, index) => (
              <TournamentCard key={tournament.id} tournament={tournament} index={index} />
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <div className="text-center py-16 rounded-2xl border border-dashed border-amber/30 dark:border-amber/20">
              <Trophy className="mx-auto h-12 w-12 text-amber/30 mb-4" />
              <p className="text-muted-foreground">No hay torneos próximos programados.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Mantente atento a nuestras redes sociales para futuras actualizaciones.
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}
