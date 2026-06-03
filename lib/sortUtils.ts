/**
 * Comparator for Array.prototype.sort that orders by a derived key. Returns 0
 * for equal keys, letting a stable sort preserve the prior order.
 */
export function compareBy<T>(
  getValue: (item: T) => string | number,
  order: 'asc' | 'desc'
) {
  return (a: T, b: T): number => {
    const aValue = getValue(a)
    const bValue = getValue(b)
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  }
}
