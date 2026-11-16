// Chrome's saved-password chooser (Credential Management API). PasswordCredential
// is Chromium-only and missing from TypeScript's DOM types.

interface PasswordCredentialData {
  id: string
  password: string
}

interface PasswordCredential extends Credential {
  readonly password: string
}

declare global {
  interface Window {
    PasswordCredential?: {
      prototype: PasswordCredential
      new (data: PasswordCredentialData): PasswordCredential
    }
  }
  interface CredentialRequestOptions {
    password?: boolean
  }
}

export function canPickSavedPassword() {
  return typeof window !== 'undefined' && Boolean(window.PasswordCredential)
}

/** Shows the browser's chooser; null when nothing is saved or the user cancels. */
export async function pickSavedPassword() {
  const Ctor = window.PasswordCredential
  if (!Ctor) return null
  try {
    const credential = await navigator.credentials.get({ password: true, mediation: 'required' })
    return credential instanceof Ctor ? { email: credential.id, password: credential.password } : null
  } catch {
    return null
  }
}

/** Offers to save the password; our forms sign in without a navigation the browser can detect. */
export async function savePassword(email: string, password: string) {
  const Ctor = window.PasswordCredential
  if (!Ctor) return
  try {
    await navigator.credentials.store(new Ctor({ id: email, password }))
  } catch {
    // The user declined, or the browser refused; nothing to do.
  }
}
