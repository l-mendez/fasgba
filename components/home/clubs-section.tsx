import { Users } from "lucide-react"

import { ClubMarquee } from "@/components/club-marquee"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { HomeClub } from "@/lib/homeUtils"
import { HomeSectionHeader } from "./section-header"

export function HomeClubsSection({ clubs }: { clubs: HomeClub[] }) {
  return (
    <section className="w-full py-16 md:py-24 overflow-hidden">
      <div className="container px-4 md:px-6">
        <ScrollReveal>
          <HomeSectionHeader
            icon={Users}
            title="Clubes Afiliados"
            subtitle="Conoce los clubes que forman parte de FASGBA"
            action={{ href: "/clubes", label: "Ver todos" }}
          />
        </ScrollReveal>
      </div>

      {clubs.length > 0 ? (
        <ScrollReveal>
          <ClubMarquee clubs={clubs} />
        </ScrollReveal>
      ) : (
        <div className="container px-4 md:px-6 text-center py-12">
          <p className="text-muted-foreground">No hay clubes afiliados disponibles.</p>
        </div>
      )}
    </section>
  )
}
