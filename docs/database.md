# Database

Supabase CLI migrations are the source of truth for the database. The linked
project ref is `uxtfxazbikfqcnnmhufh`.

## Source Of Truth

- Current executable migrations live in `supabase/migrations/`.
- Supabase CLI config lives in `supabase/config.toml`.
- Generated TypeScript database types live in `lib/database.types.ts`.
- Historical SQL snippets live in `docs/database/legacy-sql/` and should not be
  applied directly.

Do not add new migrations under `app/db`, `supabase-migrations`, or `scripts`.
Those locations are intentionally retired to avoid conflicting schema history.

## Workflow

Create a migration:

```bash
supabase migration new descriptive_name
```

Check pending migrations against the linked remote:

```bash
npm run db:status
npm run db:push:dry-run
```

Apply migrations:

```bash
npm run db:push
```

Regenerate TypeScript types after schema changes:

```bash
npm run db:types
```

Commit the migration and the regenerated `lib/database.types.ts` together.

## Auth And RLS Model

Supabase Auth owns identity and sessions. App roles are stored in public tables:

- `admins`: site-wide FASGBA admins.
- `club_admins`: club-scoped admins. A user can also be a site admin.
- `alumnos`: users allowed to access school documents.
- `user_follows_club`: normal user follow preferences.

Public tables such as clubs, news, tournaments, teams, players, and games remain
readable to unauthenticated users where the site needs public pages. Mutations
are scoped by RLS helpers such as `is_site_admin`, `is_club_admin`, and
`can_manage_tournament`.

Server routes still perform authorization checks for UX and clear errors. RLS is
the database backstop for direct Supabase client access.

## Types And DTOs

Use three layers deliberately:

- `lib/database.types.ts`: generated DB rows, inserts, updates, functions, and
  relationships. Never edit this file by hand.
- `lib/db-types.ts`: short aliases such as `DbRow<'clubs'>`,
  `ClubRow`, `NewsInsert`, and `TournamentUpdate`.
- Feature DTOs: app-facing shapes returned by utility functions or API routes,
  usually composed from DB aliases plus computed fields.

Example:

```ts
import type { ClubRow } from "@/lib/db-types"

export type ClubWithStats = ClubRow & {
  adminCount: number
  followersCount: number
  newsCount: number
}
```

Keep database names in DB aliases (`created_by_auth_id`, `club_id`) and only map
to UI-friendly names when the consuming component or API contract needs it.

## Known Legacy Edge

`app/components/chess-game-block.tsx` still has a legacy `public.users` lookup for
rich-text chess player metadata. The generated remote schema has no canonical
`public.users` table, and browser clients cannot list Supabase Auth users. Do
not copy this pattern into new code; replace it with an explicit player/profile
DTO if that UI path becomes active again.
