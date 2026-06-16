# CLAUDE.md

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
```

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

## Auth And Roles

Supabase Auth owns identity and sessions. Roles are DB rows:

- `admins`: site-wide FASGBA admins.
- `club_admins`: club-scoped admins; users may administer multiple clubs.
- `alumnos`: school document access.
- `user_follows_club`: normal user follow preferences.

A user can be both a site admin and a club admin. Unauthenticated users can read
public content. API routes should still check auth for clear UX/errors, and RLS
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
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
