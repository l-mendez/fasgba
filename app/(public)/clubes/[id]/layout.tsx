import { notFound } from "next/navigation"
import { getClubCached, parseClubId } from "./club-data"

// Existence check lives here, above loading.tsx's Suspense boundary, so missing
// or invalid clubs get a real HTTP 404 instead of a streamed soft 404.
export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const clubId = parseClubId((await params).id)
  if (!clubId || !(await getClubCached(clubId))) notFound()
  return children
}
