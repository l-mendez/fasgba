"use client"

import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-terracotta" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Confirma tu email
          </h1>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un correo electrónico con un enlace para confirmar tu cuenta.
            Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button
            onClick={handleContinue}
            disabled={isAttempting}
            className="w-full bg-terracotta hover:bg-terracotta/90 text-white"
          >
            {isAttempting ? "Cargando..." : "Volver al inicio"}
          </Button>
        </div>
      </div>
    </div>
  )
} 