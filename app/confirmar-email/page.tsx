"use client"

import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AuthShell } from "@/app/auth/components/auth-shell"

export default function ConfirmEmailPage() {
  const [isAttempting, setIsAttempting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleContinue = async () => {
    setIsAttempting(true)
    
    // Try to sign in with stored credentials
    if (typeof window !== 'undefined') {
      const storedCredentials = sessionStorage.getItem('signupCredentials')
      
      if (storedCredentials) {
        try {
          const { email, password } = JSON.parse(storedCredentials)
          
          // Attempt to sign in
          await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          // Clear stored credentials regardless of success/failure
          sessionStorage.removeItem('signupCredentials')
          sessionStorage.removeItem('intendedDestination')
        } catch (error) {
          // Silently handle any errors
          console.log('Auto sign-in attempt completed')
        }
      }
    }
    
    // Always redirect to home page, regardless of sign-in success/failure
    router.push('/')
    router.refresh()
  }

  return (
    <AuthShell title="Confirma tu email">
      <div className="space-y-4 text-center">
        <Mail className="mx-auto h-10 w-10 text-amber" />
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada.
        </p>
        <Button
          onClick={handleContinue}
          disabled={isAttempting}
          className="w-full bg-terracotta text-white hover:bg-terracotta/90"
        >
          {isAttempting ? "Cargando..." : "Volver al inicio"}
        </Button>
      </div>
    </AuthShell>
  )
}
