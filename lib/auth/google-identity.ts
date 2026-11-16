// Minimal types for Google Identity Services (https://accounts.google.com/gsi/client).
// Reference: https://developers.google.com/identity/gsi/web/reference/js-reference

export const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

export interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  nonce?: string
  context?: 'signin' | 'signup' | 'use'
  ux_mode?: 'popup' | 'redirect'
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  itp_support?: boolean
  use_fedcm_for_prompt?: boolean
  use_fedcm_for_button?: boolean
}

interface GoogleButtonConfig {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface GoogleIdApi {
  initialize: (config: GoogleIdConfig) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void
  prompt: () => void
  cancel: () => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
  }
}

/**
 * Supabase verifies the ID token's nonce: Google gets the SHA-256 hex digest,
 * Supabase gets the raw value.
 */
export async function createNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hashed }
}
