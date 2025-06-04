"use client"

import { Suspense } from "react"
import { AuthButton } from "./auth-button"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface LoginButtonProps {
  email: string
  password: string
  className?: string
  children?: React.ReactNode
}

function LoginButtonContent(props: LoginButtonProps) {
  return (
    <AuthButton
      {...props}
      mode="signin"
      children={props.children || "Iniciar Sesión"}
    />
  )
}

function LoginButtonFallback() {
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

export function LoginButton(props: LoginButtonProps) {
  return (
    <Suspense fallback={<LoginButtonFallback />}>
      <LoginButtonContent {...props} />
    </Suspense>
  )
} 