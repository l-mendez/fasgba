"use client"

import { AuthButton } from "@/app/components/auth-button"
import { createClient } from "@/lib/supabase/client"

export interface LoginButtonProps {
  email: string
  password: string
  className?: string
  children?: React.ReactNode
}

export function LoginButton(props: LoginButtonProps) {
  return (
    <AuthButton
      {...props}
      mode="signin"
      children={props.children || "Iniciar Sesión"}
    />
  )
}