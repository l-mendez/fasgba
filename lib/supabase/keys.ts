// Supabase API keys. Prefer the new publishable/secret keys and fall back to the
// legacy anon/service_role names until every environment has been migrated.
// The secret key is server-only: never add it to next.config `env` (that inlines
// it into browser bundles).
export const SUPABASE_PUBLISHABLE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!

export const SUPABASE_SECRET_KEY = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!
