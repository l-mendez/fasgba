"use client"

import { AuthButton } from "./auth-button"

export interface SignupButtonProps {
  email: string
  password: string
  className?: string
  children?: React.ReactNode
  onSuccess?: () => boolean
}

export function SignupButton(props: SignupButtonProps) {
  return (
    <AuthButton
      {...props}
      mode="signup"
      children={props.children || "Registrarse"}
    />
  )
}
