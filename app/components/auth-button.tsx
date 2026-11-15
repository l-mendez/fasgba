"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getPostLoginDestination } from "@/lib/auth/redirect"

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

  const getRedirectDestination = () => redirectTo || getPostLoginDestination(searchParams)

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
            setError("La contraseña no cumple con los requisitos de seguridad")
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
        
        if (mode === "signin" || data.session) {
          // Signed in (signup returns a session when email confirmation is off)
          router.push(destination)
          router.refresh()
        } else {
          // Kept only to offer "Reenviar email" on the confirmation page
          sessionStorage.setItem('signupEmail', email)
          router.push('/confirmar-email')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full ${className || ""}`}
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
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
} 