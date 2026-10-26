"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell, authLinkClass } from "@/app/auth/components/auth-shell"
import { ForgotPasswordButton } from "./components/forgot-password-button"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const backToLogin = (
    <p>
      <Link href="/login" className={authLinkClass}>
        Volver a iniciar sesión
      </Link>
    </p>
  )

  if (submitted) {
    return (
      <AuthShell title="Revisa tu email" links={backToLogin}>
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Enviamos un enlace para restablecer tu contraseña a{" "}
            <strong className="text-foreground">{email}</strong>.
          </p>
          <p>Si no lo ves, revisa la carpeta de spam.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Recuperar Contraseña" links={backToLogin}>
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
        <ForgotPasswordButton email={email} onSuccess={() => setSubmitted(true)} />
      </form>
    </AuthShell>
  )
}
