# UI Conventions

Rules the user has repeatedly corrected. Apply them before showing UI work.
Less text is better; every page must work at 390px and desktop, light and dark.

## Text

- No subtitles, taglines, or helper paragraphs that restate the obvious. No
  `DialogDescription` unless it carries real information.
- Short titles without "FASGBA" ("Torneos", not "Torneos FASGBA").
- Empty states: one short line.
- Never ship placeholder/mock content; hide a section when it has no data.

## Reuse These Components

| Need | Component |
| --- | --- |
| Page header | `PageHero` (`components/page-hero.tsx`) |
| Section title + "Ver más ›" | `SectionHeader` (`components/section-header.tsx`) |
| Status/info chip | `InfoPill` (`components/info-pill.tsx`), always with an icon |
| Rating delta ▲/▼ | `RatingChange` (`components/rating-change.tsx`) |
| Admin page header | `AdminPageHeader` (`components/admin-page-header.tsx`) |
| Confirm destructive action | `AdminConfirmDialog` (`components/admin-confirm-dialog.tsx`) |
| Buttons | `Button` default variant is already terracotta; don't hand-write `bg-terracotta hover:bg-terracotta/90` |

## Color

- Only theme tokens (`background`, `card`, `muted`, `muted-foreground`,
  `border`, `primary`, `accent`, `destructive`) and brand colors (`terracotta`,
  `amber`). ESLint rejects Tailwind palette colors like `text-green-600`.
- Headings `text-terracotta`; labels `text-sm font-medium`; secondary text
  `text-muted-foreground`.
- No white text on amber, no amber text on amber tints. Use terracotta text on
  `bg-amber/15`.
- The same action uses the same button variant on every row.

## Interaction

- No hover animations (`scale`, `translate`, shadow lifts) and no hover color
  swaps. Text links: `hover:underline`. Cards: `hover:border-amber`.
- Link CTAs end with `ChevronRight` (›), not `ArrowRight`.
- Prefer lucide icons with `aria-label` over words for prev/next/close/clear.
- If it looks clickable it must be clickable. Cards use the stretched-link
  pattern: card `relative`, title `<Link className="after:absolute after:inset-0">`,
  inner controls `relative z-10`.

## Layout

- Grid cards: equal heights (`h-full flex flex-col`, CTA `mt-auto`), `p-4`,
  `gap-3`.
- Logos: `object-contain` on `bg-white`, never cropped. Photos
  `aspect-[4/3] object-cover`.
- Section after the hero: `pt-6 pb-12 md:pt-8 md:pb-16`; other sections at
  most `py-12 md:py-16`.
- Dialogs: header/footer `px-6 py-4`, body `py-5`, scrollable body with the
  actions always visible; full-screen on phones when content is long.

## Verify Visually

Run `pnpm shot <path> --all` (`scripts/screenshot.mjs`) for desktop + mobile and
light + dark, and look at the images before reporting UI as done. Don't hand-roll
`chrome --headless --window-size=390,…`: headless Chrome clamps width to 500px. Pages behind
login can't be captured headlessly; use Claude in Chrome with the user's
profile, one tab per agent, never in parallel with other agents.
