"use client"

import type { MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { canPickSavedPassword, pickSavedPassword } from "@/lib/auth/password-credential"

/**
 * onClick for "Iniciar sesión" links: in browsers with a saved-password chooser
 * (Chrome), offer the saved passwords first and sign in without leaving the
 * page. Falls through to /login when nothing is saved, the user cancels, or
 * the saved password no longer works.
 */
export function useSavedPasswordLogin() {
  const router = useRouter()

  return async (event: MouseEvent<HTMLAnchorElement>) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
    if (modified || !canPickSavedPassword()) return

    event.preventDefault()
    const href = event.currentTarget.getAttribute("href") ?? "/login"
    const saved = await pickSavedPassword()
    if (saved) {
      const { error } = await createClient().auth.signInWithPassword(saved)
      if (!error) return
    }
    router.push(href)
  }
}
