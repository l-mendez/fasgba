"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Component that handles auth redirects from Supabase.
 * When Supabase redirects to the homepage with auth tokens in the hash,
 * this component redirects to the appropriate page based on the auth type.
 */
export function AuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if there are auth tokens in the URL hash
    const hash = window.location.hash
    if (!hash || hash.length <= 1) return

    // Parse the hash parameters
    const hashParams = new URLSearchParams(hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    // If we have auth tokens
    if (accessToken) {
      console.log('Auth tokens detected in URL, type:', type)

      // Determine where to redirect based on type
      if (type === 'recovery') {
        // Password reset flow
        console.log('Redirecting to password reset page...')
        router.replace(`/auth/reset-password${hash}`)
      } else if (type === 'signup' || type === 'email') {
        // Email confirmation flow
        console.log('Redirecting to email confirmation page...')
        router.replace(`/confirmar-email${hash}`)
      } else {
        // Other auth flows - just clean up the hash
        console.log('Cleaning up auth hash from URL')
        router.replace(window.location.pathname)
      }
    }
  }, [router])

  // This component doesn't render anything
  return null
}
