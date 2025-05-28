"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export interface LoginButtonProps {
  email: string
  password: string
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ 
  className, 
  children = "Iniciar Sesión",
  email,
  password
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = async () => {
    if (!email || !password) {
      setError("Email y contraseña son requeridos")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Credenciales inválidas. Por favor, verifica tu email y contraseña.")
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Por favor, confirma tu email antes de iniciar sesión.")
        } else {
          setError("Error al iniciar sesión. Por favor, intenta nuevamente.")
        }
        return
      }

      if (data?.user) {
        router.push('/perfil')
      }
    } catch (error: any) {
      console.error("Login failed:", error)
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