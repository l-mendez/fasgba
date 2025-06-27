"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export interface ForgotPasswordButtonProps {
  email: string
  className?: string
  children?: React.ReactNode
  onSuccess?: () => void
}

export function ForgotPasswordButton({ 
  className, 
  children,
  email,
  onSuccess
}: ForgotPasswordButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleClick = async () => {
    if (!email || !email.trim()) {
      setError("Email es requerido")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Por favor ingresa un email válido")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (resetError) {
        // For security reasons, we don't reveal if the email exists or not
        // Always show success message regardless of whether email exists
        console.error('Reset password error:', resetError)
      }

      // Always call onSuccess to show the success message
      // This prevents user enumeration attacks
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      // Still show success to prevent user enumeration
      if (onSuccess) {
        onSuccess()
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
            Enviando...
          </>
        ) : (
          children || "Enviar enlace de recuperación"
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  )
} 