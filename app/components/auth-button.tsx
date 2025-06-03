"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export interface AuthButtonProps {
  email: string
  password: string
  className?: string
  children?: React.ReactNode
  mode: "signin" | "signup"
  onSuccess?: () => boolean
}

export function AuthButton({ 
  className, 
  children,
  email,
  password,
  mode,
  onSuccess
}: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleClick = async () => {
    if (!email || !password) {
      setError("Email y contraseña son requeridos")
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
        // First check if the user already exists
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (existingUser?.user) {
          setError("Este email ya está registrado")
          setIsLoading(false)
          return
        }

        // If no existing user, proceed with signup
        response = await supabase.auth.signUp({
          email,
          password,
        })
      }

      const { data, error: authError } = response

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          setError("Credenciales inválidas")
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Confirma tu email antes de iniciar sesión")
        } else if (authError.message.includes("already registered")) {
          setError("Este email ya está registrado")
        } else if (authError.message.includes("password")) {
          setError("La contraseña debe tener al menos 6 caracteres")
        } else if (authError.message.includes("email")) {
          setError("Ingresa un email válido")
        } else {
          setError(`Error: ${authError.message}`)
        }
        return
      }

      if (data?.user) {
        if (mode === "signup") {
          router.push('/confirmar-email')
        } else {
          // Force a page refresh to update the session
          router.push('/admin')
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