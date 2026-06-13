"use client"

import Link from "next/link"
import { useState } from "react"
import { SiteFooter } from "@/components/site-footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ForgotPasswordButton } from "./components/forgot-password-button"
import { PageHero } from "@/components/page-hero"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmissionSuccess = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <PageHero
            title="Email Enviado"
            subtitle="Revisa tu bandeja de entrada"
          />
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Revisa tu email</CardTitle>
                    <CardDescription>Sigue los pasos en el mail que te enviamos para restablecer tu contraseña</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Te hemos enviado un enlace de restablecimiento de contraseña a <strong>{email}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Si no ves el email, revisa tu carpeta de spam o correo no deseado.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                      <Link href="/login" className="text-terracotta hover:underline">
                        Volver al inicio de sesión
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <PageHero
          title="Recuperar Contraseña"
          subtitle="Te enviaremos un enlace para restablecer tu contraseña"
        />
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Restablecer contraseña</CardTitle>
                  <CardDescription>Ingresa tu correo electrónico para recibir las instrucciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <ForgotPasswordButton 
                      email={email}
                      onSuccess={handleSubmissionSuccess}
                    />
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="text-sm text-muted-foreground text-center">
                    ¿Recordaste tu contraseña?{" "}
                    <Link href="/login" className="text-terracotta hover:underline">
                      Iniciar sesión
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
} 