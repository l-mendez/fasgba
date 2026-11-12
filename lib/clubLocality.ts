import { findLocality } from '@/lib/partidos'

// Known locality of a club address ("San Martín 1041, Quilmes" → "Quilmes"),
// or null when it names none.
export function clubLocality(address: string | null): string | null {
  return findLocality(address)?.locality ?? null
}
