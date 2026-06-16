import Link from "next/link"
import { ArrowRight, Calendar, MapPin } from "lucide-react"

import { ScrollReveal } from "@/components/scroll-reveal"
import type { HomeTournament } from "@/lib/homeUtils"

export function TournamentCard({ tournament, index }: { tournament: HomeTournament; index: number }) {
  return (
    <ScrollReveal delay={index * 100}>
      <Link href={`/torneos/${tournament.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-amber/25 dark:border-amber/10 bg-gradient-to-br from-background to-amber/10 dark:to-amber/5 p-6 shadow-sm dark:shadow-none transition-all duration-300 hover:border-amber/50 dark:hover:border-amber/30 hover:shadow-xl hover:shadow-amber/10 dark:hover:shadow-amber/5 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber/5 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-terracotta transition-colors">
                {tournament.title}
              </h3>
              {tournament.is_ongoing && (
                <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                  En curso
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-amber flex-shrink-0" />
              <span className="line-clamp-1">
                {tournament.formatted_start_date || "Fecha por confirmar"}
                {tournament.time && ` - ${tournament.time}`}
              </span>
            </div>
            {tournament.place && (
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-amber flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{tournament.place}</span>
              </div>
            )}
            {tournament.description && (
              <p className="mt-4 text-sm text-muted-foreground/80 line-clamp-2">{tournament.description}</p>
            )}
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-terracotta group-hover:text-terracotta-light transition-colors">
              <span>Ver detalles</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}
