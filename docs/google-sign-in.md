# Google sign-in

Supabase Auth's Google provider, used two ways by `components/auth/google-sign-in.tsx`
(on `/login` and `/registro`):

1. **Google Identity Services** (when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set):
   Google's button and One Tap return an ID token that goes to
   `supabase.auth.signInWithIdToken` with a nonce. No redirect, and Google's
   consent shows fasgba.com.
2. **Redirect flow** (fallback when the env var is unset or Google's script is
   blocked): `signInWithOAuth` → Google → Supabase →
   `app/auth/callback/route.ts` (PKCE `exchangeCodeForSession`). Consent shows
   the Supabase project domain.

After either flow, `ensureProfileNames` (`lib/auth/profile-names.ts`) fills
`user_metadata.nombre/apellido` from Google's claims if they are empty.
Supabase links Google to an existing account with the same verified email.
Google-only users can create a password in `/ajustes`; `userHasPassword`
(`lib/auth/password.ts`) decides whether the current password is required.

## One Tap on public pages

`components/auth/google-one-tap.tsx` is mounted in `SiteHeader`, so every page
with the public header prompts signed-out visitors once per page load (not on
`/login`, `/registro`, `/admin`, `/club-admin`). It uses `auto_select`: users
who already granted consent are signed in without a click (Chrome allows one
automatic attempt every 10 minutes). The visitor stays on the page.

GIS is initialized once per page load (`lib/auth/google-gis.ts`) and shared by
the header One Tap and the login/registro button. Never `initialize()` again or
`cancel()` on navigation: both abort Google's pending FedCM request
(`AbortError`). An open prompt stays usable on the next page, whose handler
takes the credential.

Every sign-out must call `disableGoogleAutoSelect()` (`lib/auth/google-session.ts`),
or One Tap signs the user straight back in. It sets a localStorage flag that the
next Google sign-in clears.

## Saved passwords

"Iniciar sesión" in the header and mobile menu (`useSavedPasswordLogin`) first
opens Chrome's saved-password chooser (`navigator.credentials.get({ password: true })`,
`lib/auth/password-credential.ts`) and signs in in place. Without saved
passwords, on cancel, or in other browsers it goes to `/login`. Password logins
call `savePassword()` so Chrome offers to save them. Login/registro inputs keep
`name` and `autocomplete="username"`/`current-password`/`new-password`.

## Setup

Google Cloud (APIs & Services):

- OAuth consent screen: External, scopes `openid`, `email`, `profile`.
- Credentials → OAuth client ID → Web application:
  - Authorized JavaScript origins: `https://fasgba.com`, `http://localhost:3000`
  - Authorized redirect URIs: `https://uxtfxazbikfqcnnmhufh.supabase.co/auth/v1/callback`

Supabase (Authentication):

- Providers → Google: enabled, client ID and secret.
- URL configuration → Redirect URLs: `https://fasgba.com/**`,
  `http://localhost:3000/**`, and the Vercel preview pattern.

Env: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` and Vercel **Production**
only. Google doesn't accept wildcard origins, so previews omit it and use the
redirect flow.
