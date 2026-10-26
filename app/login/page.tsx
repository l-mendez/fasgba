"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginButton } from "@/app/components/login-button"
import { AuthShell, authLinkClass } from "@/app/auth/components/auth-shell"
import { PasswordInput } from "@/app/auth/components/password-input"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <AuthShell
      title="Iniciar sesión"
      links={
        <>
          <p>
            ¿No tienes una cuenta?{" "}
            <Link href="/registro" className={authLinkClass}>
              Regístrate
            </Link>
          </p>
          <p>
            <Link href="/recuperar-contrasena" className={authLinkClass}>
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <LoginButton
          email={email}
          password={password}
          className="border-terracotta bg-terracotta text-white hover:border-terracotta hover:bg-terracotta/90"
        />
      </form>
    </AuthShell>
  )
}
