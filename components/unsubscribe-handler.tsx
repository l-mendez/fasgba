"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function UnsubscribeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const off = searchParams.get('notifications') === 'off' || searchParams.get('notificaciones') === 'off'
      if (off) {
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          await fetch('/api/users/me/notifications', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`,
            },
            body: JSON.stringify({ notifications: { type: 'ninguna' } })
          })
        } finally {
          const url = new URL(window.location.href)
          url.searchParams.delete('notifications')
          url.searchParams.delete('notificaciones')
          router.replace(url.toString(), { scroll: false })
          router.refresh()
        }
      }
    }
    run()
  }, [router, searchParams])

  return null
}