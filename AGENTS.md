<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Guidance for coding agents working in this repository.

## Project

FASGBA is a chess federation platform for Federación de Ajedrez del Sur del
Gran Buenos Aires. It manages public content, clubs, tournaments, rankings,
school documents, and admin/club-admin workflows.

## Commands

```bash
pnpm dev                  # Development server
pnpm run build            # Production build
pnpm run lint             # ESLint
pnpm run type-check       # TypeScript validation
pnpm run db:status        # Supabase local/remote migration status
pnpm run db:push:dry-run  # Preview pending remote migrations
pnpm run db:push          # Apply pending remote migrations
pnpm run db:types         # Regenerate lib/database.types.ts from Supabase
pnpm run migrate:ranking  # Migrate ranking data
pnpm run send:admin-update  # Send admin update emails
pnpm run test:email       # Test email configuration
pnpm shot <path> [--mobile] [--dark] [--all]  # Full-page screenshots → .context/shots/
```

## Local Environment

- The dev server talks to the **production** Supabase project. There is no
  staging DB: never submit forms, delete, or write rows while testing unless the
  user asked. Preview writes with dry-run helpers (see
  `lib/chess-results/dry-run.ts`).
- Run the dev server with `pnpm dev --port $CONDUCTOR_PORT` (Conductor's run
  script) in the background; log to `.context/dev.log`.
- `.env.local` is per workspace. The source of truth is the root checkout's
  `.env.local`; when the user changes keys, update both. `.worktreeinclude`
  copies it into agent worktrees. Every variable is listed in `.env.example`.
- Agent worktrees branch from the root repo's HEAD, not this workspace's branch.
  Give subagents the base SHA and have them check it before starting.
- The shell is zsh: quote globs and URLs (`--include='*.ts'`, `'...?limit=1'`).
  Don't `sleep`; use `gh pr checks --watch` or background tasks.
- Supabase CLI exits 137 on every call → broken Homebrew signature:
  `HOMEBREW_NO_AUTO_UPDATE=1 brew upgrade supabase`, then re-run
  `supabase link --project-ref uxtfxazbikfqcnnmhufh`.
- Inspect the live DB read-only with `supabase db query --linked "<sql>"`.

## PRs And Deploys

- Merges are squash merges. "Automerge" means `gh pr merge --squash --auto`.
  If the user asks for a review before merging, finish it before merging.
- Vercel deploys from `master`. `vercel.json` pins the build/install commands
  and overrides the dashboard. For a production 404 (`x-vercel-error:
  NOT_FOUND`), check the latest deploy's build duration and logs
  (`vercel ls --prod`, `vercel inspect --logs <url>`) before blaming quotas.
- Vercel Production and Preview both need every server env var
  (`SUPABASE_SECRET_KEY`, `CRON_SECRET`, `NO_REPLY_PASSWORD`).

## Caching

Public pages are statically cached with `revalidate = false` and invalidated on
demand. **Never add time-based `revalidate`** (a number): it exhausted the
Vercel ISR-write quota and took fasgba.com down. CI rejects it. Every mutation of
cached content must call its invalidator in `lib/cache/` (`revalidateNewsCache`,
`revalidateClubsCache`, `revalidateTorneosCache`, …); add new scopes in
`lib/cache/scopes.ts`.

## Tech Stack

- Next.js 16 App Router
- Supabase Auth, PostgreSQL, Storage, and RLS
- Tailwind CSS, Shadcn UI, Radix UI, lucide-react
- React Hook Form and Zod
- Tiptap rich text
- chess.js, react-chessboard, and PGN parsing
- Nodemailer with Zoho SMTP

## Database Source Of Truth

Use Supabase CLI for all schema work.

- Project ref: `uxtfxazbikfqcnnmhufh`
- Config: `supabase/config.toml`
- Migrations: `supabase/migrations/`
- Generated types: `lib/database.types.ts`
- DB aliases: `lib/db-types.ts`
- DB docs: `docs/database.md`

Historical SQL lives in `docs/database/legacy-sql/` for audit context only. Do
not add or run migrations from `app/db`, `supabase-migrations`, or `scripts`.

When schema changes, create a Supabase migration, run a dry run, apply it only
when requested, regenerate `lib/database.types.ts`, and commit both the
migration and generated types.

Migrations and merges must not leave production broken. When opening a PR with
a migration, tell the user whether it must be applied before merging (code
depends on new columns/functions) or right after (restrictive policy changes),
and ask. Never change production data (`update`/`delete`) without asking.

Live policy names drift from the legacy SQL. Look them up in `pg_policies`
before dropping, or drop them by lookup inside a `DO` block.

## Auth And Roles

Supabase Auth owns identity and sessions. Roles are DB rows:

- `admins`: site-wide FASGBA admins.
- `club_admins`: club-scoped admins; users may administer multiple clubs.
- `alumnos`: school document access.
- `user_follows_club`: normal user follow preferences.

A user can be both a site admin and a club admin. Unauthenticated users can read
public content, except documentos: site admins and club admins see them
(`escuela` documents: site admins and `alumnos`), enforced by `can_view_documento` and a private
storage bucket. API routes should still check auth for clear UX/errors, and RLS
must remain the database backstop.

Key files:

- `lib/middleware/auth.ts`: API auth helpers.
- `hooks/useAuth.ts`: client auth/permission state.
- `app/api/users/me/permissions/route.ts`: permission response for UI state.

## Types And DTOs

Use the database/app boundary consistently:

- `lib/database.types.ts` is generated. Never hand edit it.
- `lib/db-types.ts` exports row/insert/update aliases like `ClubRow`,
  `NewsInsert`, and `TournamentUpdate`.
- Feature DTOs compose DB aliases with computed/joined fields.

Example:

```ts
import type { ClubRow } from "@/lib/db-types"

export type ClubWithStats = ClubRow & {
  adminCount: number
  followersCount: number
  newsCount: number
}
```

Keep DB field names in DB types (`club_id`, `created_by_auth_id`). Map to
UI/API-specific names only at the feature boundary that needs them.

## Conventions

- Prioritize UX: minimize steps, support search by multiple useful fields, and
  keep admin workflows responsive.
- Reuse existing utilities and schemas before adding new abstractions.
- Keep files short and changes scoped.
- Server Components by default; use client components only for interactivity.
- UI copy and emails are Spanish.
- Use lucide-react icons in controls where available.
- Read `docs/ui.md` before any UI work: palette, shared components, hover and
  card rules, and how to screenshot.
- Supabase keys: read them from `lib/supabase/keys.ts` (`SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY`). Never expose the secret key to the client and never
  add it to `next.config` `env` (that inlines it into browser bundles).
