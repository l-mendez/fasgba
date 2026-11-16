"use client"

import Script from "next/script"
import { useEffect, useEffectEvent, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { GSI_SCRIPT_SRC, createNonce, type GoogleCredentialResponse } from "@/lib/auth/google-identity"
import { isGoogleAutoSelectOff, signInWithGoogleCredential } from "@/lib/auth/google-session"

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

  const onCredential = useEffectEvent(async (response: GoogleCredentialResponse, rawNonce: string) => {
    const { error } = await signInWithGoogleCredential(response.credential, rawNonce)
    if (error) {
      console.error("Google One Tap sign-in failed:", error)
      toast.error("No se pudo iniciar sesión con Google. Intenta nuevamente.")
    }
  })

  useEffect(() => {
    const id = window.google?.accounts.id
    if (!signedOut || !gisLoaded || !id || !GOOGLE_CLIENT_ID || prompted) return

    let cancelled = false
    let shown = false
    void createNonce().then(({ raw, hashed }) => {
      if (cancelled || prompted) return
      prompted = shown = true
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        context: "signin",
        auto_select: !isGoogleAutoSelectOff(),
        itp_support: true,
        use_fedcm_for_prompt: true,
        callback: (response) => void onCredential(response, raw),
      })
      id.prompt()
    })

    return () => {
      cancelled = true
      // Signed in another way, or left the public layout (the login page
      // initializes its own prompt).
      if (shown) id.cancel()
    }
  }, [signedOut, gisLoaded])

  if (!GOOGLE_CLIENT_ID || !signedOut) return null
  return <Script src={GSI_SCRIPT_SRC} strategy="lazyOnload" onReady={() => setGisLoaded(true)} />
}
