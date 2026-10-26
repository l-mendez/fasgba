import { redirect } from "next/navigation"

import { clubAdminEditorHref } from "@/lib/club-admin/links"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RedirectToUnifiedEditPage({ params }: PageProps) {
  const { id } = await params
  redirect(clubAdminEditorHref(`/noticias/${id}/editar`))
}
