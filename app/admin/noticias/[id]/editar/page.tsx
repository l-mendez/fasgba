import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RedirectToUnifiedEditPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/noticias/${id}/editar`)
} 