import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Mark this page as dynamic since it requires server-side authentication
export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button"
import { AdminContentSkeleton } from "@/components/admin-loading-skeletons"
import { AdminPageHeader } from "@/components/admin-page-header"
import { NewsTable } from "@/components/news-table"
import { ErrorAlert } from "@/components/error-alert"
import { fetchAdminNewsPage, type AdminNewsItem } from "@/lib/adminNews"

const PAGE_SIZE = 20

async function fetchInitialData(): Promise<{ news: AdminNewsItem[]; total: number; clubs: { id: number; name: string }[] }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('No tienes acceso a esta información')
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', user.id)
    .single()
  if (adminError || !adminData) {
    throw new Error('No tienes permisos de administrador para ver esta información')
  }

  const [{ news, total }, { data: clubs }] = await Promise.all([
    fetchAdminNewsPage({ page: 1, limit: PAGE_SIZE }),
    supabase.from('clubs').select('id, name').order('name', { ascending: true }),
  ])

  return { news, total, clubs: clubs || [] }
}

export default function AdminNoticiasPage() {
  return (
    <div className="container py-6">
      <div className="space-y-6">
        <AdminPageHeader
          title="Noticias"
          action={
            <Button asChild className="bg-terracotta hover:bg-terracotta/90">
              <Link href="/noticias/nueva?source=admin">
                <Plus className="h-4 w-4 mr-2" />
                Nueva noticia
              </Link>
            </Button>
          }
        />
        <Suspense fallback={<AdminContentSkeleton rows={6} />}>
          <AdminNoticiasContent />
        </Suspense>
      </div>
    </div>
  )
}

async function AdminNoticiasContent() {
  let data: Awaited<ReturnType<typeof fetchInitialData>> | null = null
  let error: string | null = null

  try {
    data = await fetchInitialData()
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar las noticias"
  }

  if (error || !data) {
    return (
      <div>
        <ErrorAlert message={error || "Error al cargar las noticias"} />
      </div>
    )
  }

  return (
    <NewsTable
      initialNews={data.news}
      initialTotal={data.total}
      pageSize={PAGE_SIZE}
      clubs={data.clubs}
    />
  )
}
