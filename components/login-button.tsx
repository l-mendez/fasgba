"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
  email?: string
  password?: string
  onSubmit?: (email: string, password: string) => Promise<void>
}

export function LoginButton({ 
  className, 
  children = "Iniciar Sesión",
  email = "",
  password = "",
  onSubmit
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!email || !password) {
      // You might want to show an error message here
      console.error("Email and password are required")
      return
    }

    setIsLoading(true)
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
  )
} 


async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
  }