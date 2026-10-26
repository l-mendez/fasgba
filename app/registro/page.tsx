"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignupButton } from "@/app/components/signup-button"
import { PasswordRequirements } from "@/components/password-requirements"
import { validatePassword } from "@/lib/utils/passwordValidation"
import { AuthShell, authLinkClass } from "@/app/auth/components/auth-shell"
import { PasswordInput } from "@/app/auth/components/password-input"

export default function Signup() {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validateForm = (currentPassword?: string, currentConfirmPassword?: string) => {
    const pwd = currentPassword ?? password
    const confirmPwd = currentConfirmPassword ?? confirmPassword

    if (!nombre.trim()) {
      setPasswordError("El nombre es requerido")
      return false
    }
    if (!apellido.trim()) {
      setPasswordError("El apellido es requerido")
      return false
    }
    if (!email.trim()) {
      setPasswordError("El email es requerido")
      return false
    }
    if (!pwd || !confirmPwd) {
      setPasswordError("Todos los campos son requeridos")
      return false
    }
    const result = validatePassword(pwd)
    if (!result.valid) {
      setPasswordError(result.errors[0])
      return false
    }
    if (pwd !== confirmPwd) {
      setPasswordError("Las contraseñas no coinciden")
      return false
    }
    setPasswordError(null)
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    if (confirmPassword) {
      validateForm(newPassword, confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    if (password) {
      validateForm(password, newConfirmPassword)
    }
  }

  return (
    <AuthShell
      title="Registro"
      links={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className={authLinkClass}>
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              type="text"
              autoComplete="given-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              type="text"
              autoComplete="family-name"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <PasswordRequirements password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
        </div>
        <SignupButton
          nombre={nombre}
          apellido={apellido}
          email={email}
          password={password}
          onSuccess={validateForm}
          className="border-terracotta bg-terracotta text-white hover:border-terracotta hover:bg-terracotta/90"
        />
      </form>
    </AuthShell>
  )
}
