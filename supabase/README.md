# Supabase

This directory is the canonical database migration workspace.

```bash
supabase migration new descriptive_name
pnpm run db:push:dry-run
pnpm run db:push
pnpm run db:types
```

`lib/database.types.ts` is generated from the linked Supabase project and should
be committed with migrations that change the schema.

Project ref: `uxtfxazbikfqcnnmhufh`
