"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function UnsubscribeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const off = searchParams.get('notifications') === 'off' || searchParams.get('notificaciones') === 'off'
    if (!off) return

    const run = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/users/me/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({ notifications: { type: 'ninguna' } })
        })
        if (!res.ok) throw new Error('Failed to disable notifications')
        toast({ title: "Notificaciones desactivadas" })
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron desactivar las notificaciones. Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        const url = new URL(window.location.href)
        url.searchParams.delete('notifications')
        url.searchParams.delete('notificaciones')
        router.replace(url.toString(), { scroll: false })
        router.refresh()
      }
    }
    run()
  }, [router, searchParams, toast])

  return null
}
