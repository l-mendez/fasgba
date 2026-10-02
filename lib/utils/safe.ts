// Runs a data fetch for a prerendered page, returning `fallback` on failure so
// an unreachable Supabase renders an empty state instead of failing the build.
export async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(label, error)
    return fallback
  }
}
