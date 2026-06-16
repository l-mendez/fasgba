# Torneos Page Redesign — Design Spec

## Goal

Redesign the public `/torneos` page to match the landing page's aurora immersive aesthetic. This serves as the template for redesigning all other public pages.

## Design Direction

**Aurora Immersive** — full dark background with animated HeroAurora canvas, glassmorphism cards, warm-only color palette, and editorial serif typography. The page should feel like a seamless continuation of the landing page experience.

## Font

**Source Serif 4** via Google Fonts (`@next/third-parties` or `next/font/google`). Applied as the primary font for the torneos page. This will be set up so it can be extended site-wide later.

Weights needed: 400 (body), 500 (labels), 600 (emphasis), 700 (titles), 800 (hero heading).

## Color Palette

Warm-only spectrum — no green, blue, or gray status colors.

| Role | Color | Hex |
|------|-------|-----|
| En curso status | Amber | `#daa056` |
| Proximo status | Dark amber | `#c48a3f` |
| Finalizado status | Terracotta | `#8f3f12` |
| Team badge accent | Light amber | `#e5bb7f` |
| Background base | Brown | `#1a0e05` |
| Active tab fill | Amber gradient | `#daa056` → `#8f3f12` |
| Card border | Amber at 15% | `rgba(218,160,86,0.15)` |
| Card border hover | Amber at 50% | `rgba(218,160,86,0.50)` |
| Text primary | White | `#ffffff` |
| Text secondary | White at 45% | `rgba(255,255,255,0.45)` |
| Link/action | Amber | `#daa056` |

## Page Structure

### 1. Background — HeroAurora (reused)

Reuse the existing `HeroAurora` canvas component from the landing page. It renders animated amber/terracotta orbs with a chess grid overlay. It covers the entire page as a fixed/absolute background layer behind all content.

No modifications to HeroAurora needed — just mount it as a full-page background.

### 2. Hero Section

- Centered layout, no 3D pawn (keeps it distinct from landing)
- Chess badge pill: `&#9822; Competencias Oficiales` — glassmorphism pill with amber border, backdrop-blur
- Title: "Torneos FASGBA" — Source Serif 4, weight 800, white
- Subtitle: "Calendario completo de torneos organizados por la Federación" — weight 400, white at 50% opacity
- ScrollReveal animation on mount

### 3. Tab Navigation

- Glassmorphism container: `bg-white/5`, `backdrop-blur-xl`, amber border at 15%, rounded-xl
- Three tabs: "En Curso (n)", "Próximos (n)", "Pasados (n)"
- Active tab: amber gradient background (`from-amber/25 to-terracotta/20`), amber border at 35%, amber text, weight 600
- Inactive tabs: white text at 40%, weight 500
- Default active tab: "En Curso" if any ongoing, else "Próximos"
- Max-width container centered, responsive text (shorter labels on mobile)

### 4. Tournament Cards

Minimal info cards with glassmorphism styling.

**Card container:**
- `bg-white/[0.04]`, `backdrop-blur-xl`
- Border: `border-amber/15`, rounded-2xl
- Decorative amber radial gradient in top-right corner
- Padding: 16-20px

**Card content (top to bottom):**
1. Status row: animated pulsing dot (amber tones per status) + status text + optional team badge (chess piece icon, amber border)
2. Title: Source Serif 4, weight 700, white, line-clamp-2
3. Meta: date (calendar icon) + location (pin icon) — white at 45%, weight 400
4. Footer: divider line (amber at 10%) + "Ver detalles →" link in amber, weight 600

**Card interactions:**
- Hover: border brightens to amber/50, box-shadow `shadow-xl shadow-amber/10`, translate-y -2px
- Transition: 300ms ease
- ScrollReveal with staggered delay (index * 100ms)

**Status dot animations:**
- "En curso": pulsing amber glow (`animate-pulse` with `box-shadow: 0 0 8px rgba(218,160,86,0.5)`)
- "Próximo": static dark amber dot
- "Finalizado": static terracotta dot, reduced opacity

### 5. Grid Layout

- Mobile (< 640px): 1 column
- Tablet (640-1023px): 2 columns
- Desktop (1024px+): 3 columns
- Gap: 14-16px

### 6. Empty State

When a tab has no tournaments:
- Centered container with dashed amber border at 15%, rounded-2xl
- `bg-white/[0.02]`
- Large chess piece character (opacity 30%)
- Primary text: "No hay torneos en curso" — white at 50%
- Secondary text: "Los torneos activos aparecerán aquí" — white at 25%

## Components to Reuse

| Component | From | Modifications |
|-----------|------|--------------|
| `HeroAurora` | `components/hero-aurora.tsx` | None — mount as full-page background |
| `ScrollReveal` | `components/scroll-reveal.tsx` | None — wrap cards and hero |
| `Badge` | `components/ui/badge.tsx` | Use outline variant with amber styling |
| `Tabs` | `components/ui/tabs.tsx` | Override styles for glassmorphism |
| `SiteHeader` | `components/site-header.tsx` | None |
| `SiteFooter` | `components/site-footer.tsx` | None |

## Components to Modify

**`TorneosClient`** (`app/torneos/components/torneos-client.tsx`): Full restyle of the client component. Replace current `TorneoCard` with minimal glassmorphism card. Restyle tabs with glassmorphism container.

**`app/torneos/page.tsx`**: Replace the current hero section with the new aurora-backed hero. Add HeroAurora as full-page background. Add Source Serif 4 font.

## Files Changed

1. `app/torneos/page.tsx` — new hero, HeroAurora background, font setup
2. `app/torneos/components/torneos-client.tsx` — restyled tabs and cards
3. `app/globals.css` — add pulse-glow keyframe if not present, status color utilities

## Dark/Light Mode

This page is dark-only by design (aurora background). The dark aesthetic is the feature. SiteHeader and SiteFooter remain theme-aware as they are shared components.

## Responsive Behavior

- Hero padding: `pt-24 pb-8` mobile, `pt-32 pb-12` desktop
- Tab labels: abbreviated on mobile ("En Curso" vs "Torneos en Curso")
- Card grid: 1 → 2 → 3 columns
- Card padding: 14px mobile, 20px desktop
- Font sizes scale down proportionally on mobile

## Performance

- HeroAurora uses requestAnimationFrame and canvas — already optimized
- Source Serif 4 loaded via `next/font/google` with `display: swap` for no layout shift
- Cards use CSS transitions only (no JS animation libraries)
- ScrollReveal uses IntersectionObserver (already in codebase)
