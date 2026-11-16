"use client"

import Script from "next/script"
import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/auth/google-icon"
import { createClient } from "@/lib/supabase/client"
import { ensureProfileNames } from "@/lib/auth/profile-names"
import { getPostLoginDestination } from "@/lib/auth/redirect"
import { GSI_SCRIPT_SRC, createNonce, type GoogleCredentialResponse } from "@/lib/auth/google-identity"

// Set only where the origin is authorized in Google Cloud (production, localhost).
// Without it (e.g. Vercel previews) the redirect flow is used.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const GIS_RENDER_TIMEOUT_MS = 4000

const ERROR_MESSAGE ="No se pudo iniciar sesión con Google. Intenta nuevamente."

interface GoogleSignInProps {
  context: "signin" | "signup"
  // Show Google's One Tap prompt on load.
  oneTap?: boolean
}

/**
 * "Continuar con Google". Prefers Google Identity Services (Google's button and
 * One Tap, ID token sent to Supabase, no redirect) and falls back to the
 * Supabase OAuth redirect flow (/auth/callback) when GIS is unavailable.
 */
function GoogleSignInContent({ context, oneTap = false }: GoogleSignInProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const buttonRef = useRef<HTMLDivElement>(null)
  // One Tap shows once per mount, not again when the theme re-renders the button.
  const promptedRef = useRef(false)
  const [useGis, setUseGis] = useState(Boolean(GOOGLE_CLIENT_ID))
  const [gisLoaded, setGisLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams?.get("error") === "oauth" ? ERROR_MESSAGE : null
  )

  const finishSignIn = async (sessionPromise: ReturnType<typeof signInWithIdToken>) => {
    setIsLoading(true)
    setError(null)
    const { data, error: authError } = await sessionPromise
    if (authError || !data.user) {
      console.error("Google sign-in failed:", authError?.message)
      setError(ERROR_MESSAGE)
      setIsLoading(false)
      return
    }
    await ensureProfileNames(createClient(), data.user)
    router.push(getPostLoginDestination(searchParams))
    router.refresh()
  }

  const onCredential = useEffectEvent((response: GoogleCredentialResponse, rawNonce: string) => {
    void finishSignIn(signInWithIdToken(response.credential, rawNonce))
  })

  useEffect(() => {
    const id = window.google?.accounts.id
    const parent = buttonRef.current
    // resolvedTheme is undefined until next-themes mounts; initializing before
    // then re-runs this effect, whose cleanup cancels One Tap mid-request.
    if (!useGis || !gisLoaded || !resolvedTheme || !id || !parent || !GOOGLE_CLIENT_ID) return

    let cancelled = false
    // Google renders a 0×0 iframe when it rejects the origin or client (403),
    // so fall back to the redirect button if nothing visible appears.
    const fallbackTimer = window.setTimeout(() => {
      if (!parent.querySelector("iframe")?.offsetHeight) setUseGis(false)
    }, GIS_RENDER_TIMEOUT_MS)

    void createNonce().then(({ raw, hashed }) => {
      if (cancelled) return
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        context,
        ux_mode: "popup",
        cancel_on_tap_outside: true,
        itp_support: true,
        use_fedcm_for_prompt: true,
        use_fedcm_for_button: true,
        callback: (response) => onCredential(response, raw),
      })
      parent.replaceChildren()
      id.renderButton(parent, {
        type: "standard",
        theme: resolvedTheme === "dark" ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width: Math.min(400, Math.max(200, parent.offsetWidth)),
        locale: "es-419",
      })
      if (oneTap && !promptedRef.current) {
        promptedRef.current = true
        id.prompt()
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      id.cancel()
    }
  }, [useGis, gisLoaded, context, oneTap, resolvedTheme])

  const signInWithRedirect = async () => {
    setIsLoading(true)
    setError(null)
    const callback = new URL("/auth/callback", window.location.origin)
    const next = getPostLoginDestination(searchParams)
    if (next !== "/") callback.searchParams.set("next", next)

    const { error: authError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
    })
    if (authError) {
      console.error("Google OAuth redirect failed:", authError.message)
      setError(ERROR_MESSAGE)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {useGis && (
        <Script
          src={GSI_SCRIPT_SRC}
          strategy="afterInteractive"
          onReady={() => setGisLoaded(true)}
          onError={() => setUseGis(false)}
        />
      )}

      {useGis ? (
        <div className="relative">
          <div ref={buttonRef} className="flex h-10 w-full justify-center" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80">
              <Loader2 className="h-4 w-4 animate-spin" aria-label="Cargando" />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithRedirect}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
          Continuar con Google
        </Button>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}

function signInWithIdToken(token: string, nonce: string) {
  return createClient().auth.signInWithIdToken({ provider: "google", token, nonce })
}

export function GoogleSignIn(props: GoogleSignInProps) {
  return (
    <Suspense fallback={<div className="h-[4.75rem]" />}>
      <GoogleSignInContent {...props} />
    </Suspense>
  )
}
