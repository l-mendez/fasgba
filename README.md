# FASGBA

Chess federation platform for Federación de Ajedrez del Sur del Gran Buenos
Aires. The app manages public content, clubs, tournaments, rankings, school
documents, and authenticated admin workflows.

## Stack

- Next.js 16 App Router
- Supabase Auth, PostgreSQL, Storage, and RLS
- TypeScript
- Tailwind CSS and Shadcn UI
- Zod and React Hook Form
- Nodemailer for email notifications
- chess.js, react-chessboard, and PGN parsing tools

## Setup

```bash
npm install
npm run dev
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NO_REPLY_PASSWORD=
```

The Supabase project ref is `uxtfxazbikfqcnnmhufh`. Conductor setup links new
workspaces automatically when the Supabase CLI is available.

## Common Commands

```bash
npm run dev              # local dev server
npm run build            # production build
npm run lint             # ESLint
npm run type-check       # TypeScript validation
npm run db:status        # local/remote migration status
npm run db:push:dry-run  # preview pending remote migrations
npm run db:push          # apply pending remote migrations
npm run db:types         # regenerate Supabase database types
```

## Database

Supabase CLI migrations in `supabase/migrations/` are the database source of
truth. Generated schema types live in `lib/database.types.ts`; app-level aliases
live in `lib/db-types.ts`.

Read `docs/database.md` before changing schema, RLS, generated types, or DTOs.
Historical SQL snippets have been moved to `docs/database/legacy-sql/` and are
not executable migration sources.

## Auth Model

Supabase Auth owns identity and sessions. App roles are separate DB rows:

- `admins`: FASGBA site admins.
- `club_admins`: admins scoped to one or more clubs.
- `alumnos`: school document access.
- `user_follows_club`: normal user follow preferences.

Users can belong to multiple role groups at the same time.

## Project Structure

- `app/`: pages, layouts, server actions, and API routes.
- `components/`: shared UI and feature components.
- `lib/`: shared data access, auth, validation, utilities, and generated DB
  types.
- `hooks/`: client hooks.
- `supabase/`: CLI config and migrations.
- `docs/`: project documentation and archived historical SQL.
