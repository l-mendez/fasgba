"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
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
        response = await supabase.auth.signUp({
          email,
          password,
        })
      }

      const { data, error: authError } = response

      if (authError) {
        console.log("Full auth error:", {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          error: authError
        })
        
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
          setError("Por favor, revisa tu email para confirmar tu cuenta.")
        } else {
          router.push('/perfil')
        }
      }
    } catch (error: any) {
      console.error("Auth failed:", error)
      setError("Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.")
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