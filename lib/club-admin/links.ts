// Editors outside the club-admin shell use these params to return to the
// club-admin lists and preselect the club (see /torneos/nuevo, /noticias/nueva).
export function clubAdminEditorHref(path: string, clubId?: number | null) {
  const params = new URLSearchParams({ source: "club-admin" })
  if (clubId) params.set("clubId", String(clubId))
  return `${path}?${params.toString()}`
}
