// Locality from a free-text club address: the last comma- or dash-separated
// part of its first line ("San Martín 1041, Quilmes" → "Quilmes",
// "Piñeiro 422- Lanús Oeste" → "Lanús Oeste"). Street-only → null.
export function clubLocality(address: string | null): string | null {
  const parts = (address?.split('\n')[0] ?? '').split(/,|\s-\s*|-\s+/).map((part) => part.trim())
  const last = parts.length > 1 ? parts.at(-1) : null
  return last && !/\d/.test(last) ? last : null
}
