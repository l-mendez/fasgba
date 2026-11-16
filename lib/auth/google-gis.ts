import type { GoogleIdApi } from '@/lib/auth/google-identity'
import { createNonce } from '@/lib/auth/google-identity'
import { isGoogleAutoSelectOff, signInWithGoogleCredential } from '@/lib/auth/google-session'

// One GIS setup per page load, shared by the One Tap in the header and the
// login/registro button. Re-initializing or cancelling on client navigation
// aborts Google's pending FedCM request (AbortError), so the prompt is left
// open across pages and whichever page is mounted handles the credential.

type SignInResult = Awaited<ReturnType<typeof signInWithGoogleCredential>>

export interface GoogleCredentialHandler {
  onStart?: () => void
  onResult: (result: SignInResult) => void
}

let ready: Promise<void> | null = null
let handler: GoogleCredentialHandler | null = null
let promptOpen = false

export function initGoogleIdentity(id: GoogleIdApi, clientId: string) {
  ready ??= createNonce().then(({ raw, hashed }) => {
    id.initialize({
      client_id: clientId,
      nonce: hashed,
      context: 'signin',
      ux_mode: 'popup',
      // Sign-out also calls GIS disableAutoSelect, which covers later prompts
      // in this page load.
      auto_select: !isGoogleAutoSelectOff(),
      itp_support: true,
      use_fedcm_for_prompt: true,
      use_fedcm_for_button: true,
      callback: async (response) => {
        promptOpen = false
        const current = handler
        current?.onStart?.()
        const result = await signInWithGoogleCredential(response.credential, raw)
        current?.onResult(result)
      },
    })
  })
  return ready
}

/** The mounted page's handler; returns the unregister function. */
export function setGoogleCredentialHandler(next: GoogleCredentialHandler) {
  handler = next
  return () => {
    if (handler === next) handler = null
  }
}

/** Shows One Tap unless it is already open. */
export function promptGoogleOneTap(id: GoogleIdApi) {
  if (promptOpen) return
  promptOpen = true
  id.prompt((notification) => {
    if (notification.isDismissedMoment()) promptOpen = false
  })
}

/** Closes One Tap when the user signed in another way. */
export function cancelGoogleOneTap(id: GoogleIdApi) {
  if (!promptOpen) return
  promptOpen = false
  id.cancel()
}
