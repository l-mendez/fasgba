import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { AdminShell } from "@/app/admin/admin-shell"
import { requireAdminAction } from "@/lib/actions/auth"
import { ForbiddenError, UnauthorizedError } from "@/lib/middleware/auth"

export const dynamic = "force-dynamic"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireAdminAction()
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      notFound()
    }
    throw error
  }

  return <AdminShell>{children}</AdminShell>
}
