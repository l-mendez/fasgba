"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { GSI_SCRIPT_SRC } from "@/lib/auth/google-identity"
import {
  cancelGoogleOneTap,
  initGoogleIdentity,
  promptGoogleOneTap,
  setGoogleCredentialHandler,
} from "@/lib/auth/google-gis"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

// Once per page load: the header stays mounted across client navigations, and
// Google applies its own cooldown after a dismissal.
let prompted = false

/**
 * Google One Tap on public pages for signed-out visitors. Returning users who
 * already granted consent are signed in automatically (auto_select). Stays on
 * the current page; the header picks up the new session.
 */
export function GoogleOneTap() {
  const { isAuthenticated, isLoading } = useAuth()
  const [gisLoaded, setGisLoaded] = useState(false)
  const signedOut = !isLoading && !isAuthenticated

  useEffect(() => {
    const id = window.google?.accounts.id
    // Signed in another way while One Tap (from this or the login page) is open.
    if (isAuthenticated && id) cancelGoogleOneTap(id)
    if (!signedOut || !gisLoaded || !id || !GOOGLE_CLIENT_ID) return

    const unregister = setGoogleCredentialHandler({
      onResult: ({ error }) => {
        if (!error) return
        console.error("Google One Tap sign-in failed:", error)
        toast.error("No se pudo iniciar sesión con Google. Intenta nuevamente.")
      },
    })
    let cancelled = false
    void initGoogleIdentity(id, GOOGLE_CLIENT_ID).then(() => {
      if (cancelled || prompted) return
      prompted = true
      promptGoogleOneTap(id)
    })
    return () => {
      cancelled = true
      unregister()
    }
  }, [gisLoaded, signedOut, isAuthenticated])

  if (!GOOGLE_CLIENT_ID || !signedOut) return null
  return <Script src={GSI_SCRIPT_SRC} strategy="lazyOnload" onReady={() => setGisLoaded(true)} />
}
