"use client"

import { Suspense } from "react"
import { AuthButton } from "./auth-button"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface SignupButtonProps {
  nombre: string
  apellido: string
  email: string
  password: string
  className?: string
  children?: React.ReactNode
  onSuccess?: () => boolean
}

function SignupButtonContent(props: SignupButtonProps) {
  return (
    <AuthButton
      {...props}
      mode="signup"
      children={props.children || "Registrarse"}
    />
  )
}

function SignupButtonFallback() {
  return (
    <Button
      disabled
      className="w-full bg-terracotta hover:bg-terracotta/90 text-white"
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Cargando...
    </Button>
  )
}

export function SignupButton(props: SignupButtonProps) {
  return (
    <Suspense fallback={<SignupButtonFallback />}>
      <SignupButtonContent {...props} />
    </Suspense>
  )
}
