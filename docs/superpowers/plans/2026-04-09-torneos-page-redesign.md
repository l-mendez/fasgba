# Torneos Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/torneos` page with aurora immersive dark aesthetic, glassmorphism cards, Source Serif 4 font, and warm-only color palette matching the landing page.

**Architecture:** Reuse `HeroAurora` as a full-page background. Restyle `TorneosClient` with glassmorphism tabs and minimal cards. Add Source Serif 4 font via `next/font/google`. Add a `pulse-amber` keyframe and `glass-card` styles to globals.css. All changes scoped to 3 files.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Source Serif 4 (Google Fonts), existing HeroAurora canvas component, ScrollReveal component.

**Spec:** `docs/superpowers/specs/2026-04-09-torneos-page-redesign.md`

---

### Task 1: Add pulse-amber keyframe to globals.css

**Files:**
- Modify: `app/globals.css:226-234`

This adds an amber-specific pulse animation for tournament status dots. The existing `pulse-glow` is generic opacity — we need one with amber box-shadow glow.

- [ ] **Step 1: Add the pulse-amber keyframe and utility after the existing pulse-glow block**

In `app/globals.css`, after line 234 (the closing `}` of `animate-pulse-glow`), add:

```css
/* Pulse amber glow for status dots */
@keyframes pulse-amber {
  0%, 100% { box-shadow: 0 0 4px rgba(218, 160, 86, 0.3); }
  50% { box-shadow: 0 0 10px rgba(218, 160, 86, 0.6); }
}

@utility animate-pulse-amber {
  animation: pulse-amber 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds with no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add pulse-amber keyframe for tournament status dots"
```

---

### Task 2: Add Source Serif 4 font to the torneos layout

**Files:**
- Create: `app/torneos/layout.tsx`

We create a layout file for the `/torneos` route that imports Source Serif 4 and applies it to the page. This avoids modifying the root layout and keeps the font scoped. Other pages can adopt it later.

- [ ] **Step 1: Create the torneos layout with Source Serif 4**

Create `app/torneos/layout.tsx`:

```tsx
import { Source_Serif_4 } from "next/font/google"

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-source-serif",
})

export default function TorneosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${sourceSerif.variable} font-[family-name:var(--font-source-serif)]`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify the font loads**

Run: `npm run dev` and open `http://localhost:3000/torneos` in the browser.
Expected: The page text should render in Source Serif 4 (a serif font), noticeably different from the default sans-serif.

- [ ] **Step 3: Commit**

```bash
git add app/torneos/layout.tsx
git commit -m "feat: add Source Serif 4 font to torneos layout"
```

---

### Task 3: Redesign the torneos server page with aurora background

**Files:**
- Modify: `app/torneos/page.tsx`

Replace the current flat gradient hero with a full-page aurora background (reusing `HeroAurora`) and a centered glassmorphism hero section.

- [ ] **Step 1: Rewrite `app/torneos/page.tsx`**

Replace the entire content of `app/torneos/page.tsx` with:

```tsx
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HeroAurora } from "@/components/hero-aurora"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import {
  type TournamentDisplay,
  getAllTournamentsForDisplay,
  filterTournamentsByStatus,
  sortTournamentsByDate,
} from "@/lib/tournamentUtils"
import TorneosClient from "./components/torneos-client"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Torneos FASGBA - Calendario de Competencias',
  description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires. Consulta próximos torneos, torneos en curso y resultados.',
  keywords: ['FASGBA', 'torneos', 'ajedrez', 'competencias', 'calendario', 'federación', 'Buenos Aires', 'inscripción'],
  openGraph: {
    title: 'Torneos FASGBA - Calendario de Competencias',
    description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires. Consulta próximos torneos, torneos en curso y resultados.',
    url: 'https://fasgba.com/torneos',
    siteName: 'FASGBA',
    images: [
      {
        url: 'https://fasgba.com/images/fasgba-logo.png',
        width: 1200,
        height: 630,
        alt: 'Torneos FASGBA',
      }
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Torneos FASGBA - Calendario de Competencias',
    description: 'Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires.',
    images: ['https://fasgba.com/images/fasgba-logo.png'],
    creator: '@FASGBA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function TorneosPage() {
  let tournaments: TournamentDisplay[] = []
  let error: string | null = null

  try {
    const supabase = await createClient()
    const tournamentsData = await getAllTournamentsForDisplay(supabase)
    tournaments = sortTournamentsByDate(tournamentsData, 'asc')
  } catch (err) {
    console.error('Error loading tournaments:', err)
    error = `Error al cargar los torneos: ${err instanceof Error ? err.message : 'Error desconocido'}`
  }

  const upcomingTournaments = filterTournamentsByStatus(tournaments, 'upcoming')
  const ongoingTournaments = filterTournamentsByStatus(tournaments, 'ongoing')
  const pastTournaments = filterTournamentsByStatus(tournaments, 'past')

  return (
    <div className="relative flex min-h-screen flex-col bg-[#1a0e05]">
      {/* Full-page aurora background */}
      <div className="fixed inset-0 z-0">
        <HeroAurora />
      </div>

      <div className="relative z-10">
        <SiteHeader pathname="/torneos" />
        <main className="flex-1">
          {/* Hero */}
          <section className="w-full pt-24 pb-8 md:pt-32 md:pb-12">
            <div className="container px-4 md:px-6">
              <ScrollReveal>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber/25 bg-amber/[0.12] px-4 py-1.5 text-sm text-amber backdrop-blur-sm">
                    &#9822; Competencias Oficiales
                  </span>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Torneos FASGBA
                  </h1>
                  <p className="max-w-[600px] text-base text-white/50 md:text-lg">
                    Calendario completo de torneos organizados por la Federación de Ajedrez del Sur del Gran Buenos Aires
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Content */}
          <section className="w-full pb-20 md:pb-32">
            <div className="container px-4 md:px-6">
              {error && (
                <Alert className="mb-6 border-amber/30 bg-amber/10">
                  <AlertDescription className="text-amber-light">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <TorneosClient
                upcomingTournaments={upcomingTournaments}
                ongoingTournaments={ongoingTournaments}
                pastTournaments={pastTournaments}
              />
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` and open `http://localhost:3000/torneos`.
Expected: Dark background with animated aurora orbs, centered hero with badge/title/subtitle, then the current (unstyled) tabs/cards below. The existing TorneosClient will look wrong at this point — that's expected and fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add app/torneos/page.tsx
git commit -m "feat: redesign torneos page with aurora background and new hero"
```

---

### Task 4: Restyle TorneosClient with glassmorphism tabs and minimal cards

**Files:**
- Modify: `app/torneos/components/torneos-client.tsx`

This is the main visual change — replace the current flat tabs and dense cards with glassmorphism styling and minimal card content.

- [ ] **Step 1: Rewrite `app/torneos/components/torneos-client.tsx`**

Replace the entire content of the file with:

```tsx
"use client"

import { Calendar, MapPin } from "lucide-react"
import Link from "next/link"

import { ScrollReveal } from "@/components/scroll-reveal"
import { cn } from "@/lib/utils"
import {
  type TournamentDisplay,
  getTournamentStatusText,
  formatDateRange,
  getLocationDisplay,
} from "@/lib/tournamentUtils"

function StatusDot({ tipo }: { tipo: 'upcoming' | 'ongoing' | 'past' }) {
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full",
        tipo === "ongoing" && "bg-amber animate-pulse-amber",
        tipo === "upcoming" && "bg-amber-dark",
        tipo === "past" && "bg-terracotta opacity-60"
      )}
    />
  )
}

function TorneoCard({
  torneo,
  tipo,
  index,
}: {
  torneo: TournamentDisplay
  tipo: 'upcoming' | 'ongoing' | 'past'
  index: number
}) {
  const dateDisplay = torneo.end_date && torneo.start_date.toDateString() !== torneo.end_date.toDateString()
    ? formatDateRange(torneo.start_date, torneo.end_date)
    : torneo.formatted_start_date

  const locationDisplay = getLocationDisplay(torneo.place, torneo.location)

  return (
    <ScrollReveal delay={index * 100}>
      <Link
        href={`/torneos/${torneo.id}`}
        className="group block glass-card rounded-2xl p-4 md:p-5 relative overflow-hidden transition-all duration-300 hover:border-amber/50 hover:shadow-xl hover:shadow-amber/10 hover:-translate-y-0.5"
      >
        {/* Corner accent */}
        <div className="absolute top-0 right-0 h-20 w-20 bg-[radial-gradient(circle_at_top_right,rgba(218,160,86,0.12),transparent_70%)]" />

        {/* Status row */}
        <div className="flex items-center gap-2 mb-3">
          <StatusDot tipo={tipo} />
          <span className={cn(
            "text-xs font-semibold",
            tipo === "ongoing" && "text-amber",
            tipo === "upcoming" && "text-amber-dark",
            tipo === "past" && "text-terracotta opacity-70"
          )}>
            {getTournamentStatusText(torneo)}
          </span>
          {torneo.tournament_type === 'team' && (
            <span className="ml-auto text-xs text-amber-dark border border-amber/20 bg-amber/10 rounded-lg px-2 py-0.5">
              &#9822; Equipos
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm md:text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-amber transition-colors duration-300">
          {torneo.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1 mb-3">
          <span className="text-xs text-white/45 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-amber/60" />
            {dateDisplay}
          </span>
          {locationDisplay && locationDisplay !== "Lugar por confirmar" && (
            <span className="text-xs text-white/45 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-amber/60" />
              {locationDisplay}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber/10 text-center">
          <span className="text-xs font-semibold text-amber group-hover:text-amber-light transition-colors duration-300">
            Ver detalles &rarr;
          </span>
        </div>
      </Link>
    </ScrollReveal>
  )
}

function EmptyState({ message, subtitle }: { message: string; subtitle: string }) {
  return (
    <div className="text-center py-16 px-6 bg-white/[0.02] border border-dashed border-amber/15 rounded-2xl">
      <div className="text-4xl mb-3 opacity-30">&#9822;</div>
      <p className="text-white/50 text-sm font-medium mb-1">{message}</p>
      <p className="text-white/25 text-xs">{subtitle}</p>
    </div>
  )
}

interface TorneosClientProps {
  upcomingTournaments: TournamentDisplay[]
  ongoingTournaments: TournamentDisplay[]
  pastTournaments: TournamentDisplay[]
}

type TabValue = "en-curso" | "proximos" | "pasados"

export default function TorneosClient({
  upcomingTournaments,
  ongoingTournaments,
  pastTournaments,
}: TorneosClientProps) {
  const defaultTab: TabValue = ongoingTournaments.length > 0 ? "en-curso" : "proximos"

  const tabs: { value: TabValue; label: string; shortLabel: string; count: number }[] = [
    { value: "en-curso", label: "En Curso", shortLabel: "En Curso", count: ongoingTournaments.length },
    { value: "proximos", label: "Próximos", shortLabel: "Próximos", count: upcomingTournaments.length },
    { value: "pasados", label: "Pasados", shortLabel: "Pasados", count: pastTournaments.length },
  ]

  const tabContent: Record<TabValue, { tournaments: TournamentDisplay[]; tipo: 'upcoming' | 'ongoing' | 'past'; emptyMessage: string; emptySubtitle: string }> = {
    "en-curso": {
      tournaments: ongoingTournaments,
      tipo: "ongoing",
      emptyMessage: "No hay torneos en curso",
      emptySubtitle: "Los torneos activos aparecerán aquí",
    },
    "proximos": {
      tournaments: upcomingTournaments,
      tipo: "upcoming",
      emptyMessage: "No hay torneos próximos programados",
      emptySubtitle: "Los próximos torneos aparecerán aquí cuando se confirmen",
    },
    "pasados": {
      tournaments: pastTournaments,
      tipo: "past",
      emptyMessage: "No hay torneos pasados registrados",
      emptySubtitle: "El historial de torneos aparecerá aquí",
    },
  }

  return (
    <div className="w-full" data-tabs-root>
      {/* Glassmorphism tabs */}
      <div className="max-w-lg mx-auto mb-8 md:mb-12">
        <div className="flex gap-1 rounded-xl border border-amber/15 bg-white/5 backdrop-blur-xl p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              data-tab={tab.value}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer",
                "text-white/40 hover:text-white/60",
                "data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber/25 data-[state=active]:to-terracotta/20",
                "data-[state=active]:border data-[state=active]:border-amber/35",
                "data-[state=active]:text-amber data-[state=active]:font-semibold",
                "data-[state=active]:shadow-sm data-[state=active]:shadow-amber/10"
              )}
              data-state={tab.value === defaultTab ? "active" : "inactive"}
              onClick={(e) => {
                const root = e.currentTarget.closest('[data-tabs-root]')
                if (!root) return
                root.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute("data-state", "inactive"))
                e.currentTarget.setAttribute("data-state", "active")
                root.querySelectorAll('[role="tabpanel"]').forEach((p) => {
                  const el = p as HTMLElement
                  el.hidden = el.dataset.tab !== tab.value
                })
              }}
            >
              <span className="hidden sm:inline">{tab.label} ({tab.count})</span>
              <span className="sm:hidden">{tab.shortLabel} ({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => {
        const { tournaments, tipo, emptyMessage, emptySubtitle } = tabContent[tab.value]
        return (
          <div
            key={tab.value}
            role="tabpanel"
            data-tab={tab.value}
            hidden={tab.value !== defaultTab}
          >
            {tournaments.length === 0 ? (
              <EmptyState message={emptyMessage} subtitle={emptySubtitle} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((torneo, index) => (
                  <TorneoCard
                    key={torneo.id}
                    torneo={torneo}
                    tipo={tipo}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify the page renders correctly**

Run: `npm run dev` and open `http://localhost:3000/torneos`.
Expected: Dark aurora background covering the full page. Glassmorphism tabs centered below the hero. Tournament cards with glass styling, amber status dots, minimal content (title, date, location, "Ver detalles"). Tabs switch content on click. Empty states show chess piece icon with descriptive text.

- [ ] **Step 3: Test responsive breakpoints**

Check in the browser at:
- 375px (mobile): 1 column cards, short tab labels
- 768px (tablet): 2 column cards
- 1024px (desktop): 3 column cards, full tab labels

- [ ] **Step 4: Test hover effects**

Hover over a card.
Expected: Border brightens to amber, shadow glow appears, card lifts slightly, title text transitions to amber.

- [ ] **Step 5: Commit**

```bash
git add app/torneos/components/torneos-client.tsx
git commit -m "feat: restyle torneos cards and tabs with glassmorphism aurora design"
```

---

### Task 5: Build verification and type-check

**Files:** None (verification only)

- [ ] **Step 1: Run the type checker**

Run: `npm run type-check 2>&1 | tail -20`
Expected: No TypeScript errors.

- [ ] **Step 2: Run the linter**

Run: `npm run lint 2>&1 | tail -10`
Expected: No lint errors (warnings are OK).

- [ ] **Step 3: Run a production build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build completes successfully. The `/torneos` route should compile as a dynamic server page.

- [ ] **Step 4: Commit any fixes if needed**

If any step above fails, fix the issue and commit:
```bash
git add -A
git commit -m "fix: resolve build errors in torneos redesign"
```
