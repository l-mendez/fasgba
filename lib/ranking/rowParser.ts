// ---------------------------------------------------------------------------
// Pure helpers for field extraction and row normalization
// ---------------------------------------------------------------------------

// Helper function to normalize names with proper capitalization
export const normalizePlayerName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper to find a column value by fuzzy name
export const getFirstValueByKeys = (obj: Record<string, any>, keys: string[]): any => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
  }
  return undefined
}

export const findPointsRaw = (obj: Record<string, any>): any => {
  const direct = getFirstValueByKeys(obj, [
    'Puntos', 'PUNTOS', 'Ranking Nuevo', 'Ranking No', 'Ranking Nro',
    'Points', 'ELO', 'Elo', 'elo', 'Rating', 'RATING', 'Puntaje', 'PUNTAJE',
  ])
  if (direct !== undefined) return direct
  const pointsKey = Object.keys(obj).find(k => /puntos|ranking|points|elo|rating|puntaje/i.test(k))
  return pointsKey ? obj[pointsKey] : undefined
}

export const findTipoRaw = (obj: Record<string, any>): any => {
  const direct = getFirstValueByKeys(obj, [
    'Tipo', 'TIPO', 'tipo', 'Tipo de Rating', 'Type', 'TYPE', 'type',
    'Modalidad', 'MODALIDAD', 'modalidad', 'Mod', 'MOD',
  ])
  if (direct !== undefined) return direct
  const tipoKey = Object.keys(obj).find(k => /tipo|type|modalidad/i.test(k.trim()))
  return tipoKey ? obj[tipoKey] : undefined
}

export const findActiveRaw = (obj: Record<string, any>): any => {
  const direct = getFirstValueByKeys(obj, [
    'Activo', 'ACTIVO', 'active', 'Active', 'ACTIVE', 'Act', 'ACT'
  ])
  if (direct !== undefined) return direct
  const activeKey = Object.keys(obj).find(k => /activo|active|act/i.test(k))
  return activeKey ? obj[activeKey] : undefined
}

export const parseActive = (value: any): boolean => {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 || value > 0
  const normalized = String(value).trim().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
  if (normalized === '1') return true
  if (['si','s','sí','si ','siempre', 'true','t','y','yes','x','activo','act','activos'].includes(normalized)) return true
  if (['no','n','false','0','inactivo','inact','inactive','non'].includes(normalized)) return false
  return false
}
