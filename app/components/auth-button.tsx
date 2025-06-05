"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export interface AuthButtonProps {
  email: string
  password: string
  nombre?: string
  apellido?: string
  className?: string
  children?: React.ReactNode
  mode: "signin" | "signup"
  onSuccess?: () => boolean
  redirectTo?: string
}

export function AuthButton({ 
  className, 
  children,
  email,
  password,
  nombre,
  apellido,
  mode,
  onSuccess,
  redirectTo
}: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get redirect destination
  const getRedirectDestination = () => {
    // Priority: explicit redirectTo prop > URL param > referrer > default
    if (redirectTo) return redirectTo
    
    const redirectParam = searchParams?.get('redirect') || searchParams?.get('redirectTo')
    if (redirectParam) return decodeURIComponent(redirectParam)
    
    // Check if we have a referrer that's not a login/signup page
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerPath = new URL(referrer).pathname
        // Don't redirect back to auth pages
        if (!referrerPath.includes('/login') && !referrerPath.includes('/signup') && !referrerPath.includes('/confirmar-email')) {
          return referrerPath
        }
      }
    }
    
    // Default fallback
    return '/admin'
  }

  const handleClick = async () => {
    if (!email || !password) {
      setError("Email y contraseña son requeridos")
      return
    }

    // For signup, also check nombre and apellido
    if (mode === "signup" && (!nombre?.trim() || !apellido?.trim())) {
      setError("Nombre y apellido son requeridos")
      return
    }

    // Run validation before making API call
    if (onSuccess && !onSuccess()) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      let response;
      
      if (mode === "signin") {
        response = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      } else {
        // Proceed with signup - let Supabase handle duplicate detection
        response = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombre?.trim(),
              apellido: apellido?.trim()
            }
          }
        })
      }

      const { data, error: authError } = response

      if (authError) {
        // Provide generic error messages to prevent user enumeration
        if (mode === "signin") {
          setError("Email o contraseña incorrectos")
        } else {
          // For signup, be more specific about common issues but still secure
          if (authError.message.includes("password")) {
            setError("La contraseña debe tener al menos 6 caracteres")
          } else if (authError.message.includes("email") || authError.message.includes("invalid")) {
            setError("Por favor verifica el formato de tu email")
          } else {
            setError("No se pudo crear la cuenta. Intenta nuevamente")
          }
        }
        return
      }

      if (data?.user) {
        const destination = getRedirectDestination()
        
        if (mode === "signup") {
          // Store credentials temporarily for auto sign-in attempt on confirmation page
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('signupCredentials', JSON.stringify({ email, password }))
            sessionStorage.setItem('intendedDestination', destination)
          }
          
          // For signup, try to sign in the user automatically (silently)
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            
            // If auto sign-in successful and user is confirmed, redirect to destination
            if (!signInError && signInData?.user && signInData?.session) {
              // Clear stored credentials since sign-in was successful
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('signupCredentials')
                sessionStorage.removeItem('intendedDestination')
              }
              router.push(destination)
              router.refresh()
              return
            }
          } catch (autoSignInError) {
            // Silently handle auto sign-in errors
            console.log('Auto sign-in attempt failed, proceeding to email confirmation')
          }
          
          // If auto sign-in failed or user needs confirmation, go to confirmation page
          router.push('/confirmar-email')
        } else {
          // Successful sign-in - redirect to intended destination
          router.push(destination)
          router.refresh() 
        }
      }
    } catch (error) {
      setIsLoading(false)
      if (error instanceof Error) {
        console.error('Auth error:', error.message)
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full bg-terracotta hover:bg-terracotta/90 text-white ${className || ""}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando...
          </>
        ) : (
          children
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  )
} 