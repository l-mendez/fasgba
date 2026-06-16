import type { ReactNode } from "react"
import Link from "next/link"

import { AdminMobileHeader, AdminNavLinks } from "@/app/admin/admin-nav-client"

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-amber/20 bg-background">
          <div className="flex h-14 items-center border-b border-amber/20 px-4">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold text-terracotta sm:inline-block">
                FASGBA
              </span>
            </Link>
          </div>
          <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
            <AdminNavLinks />
          </div>
        </div>
      </div>

      <div className="w-full lg:ml-64">
        <AdminMobileHeader />
        <main className="w-full py-6 px-4 lg:px-8 overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
