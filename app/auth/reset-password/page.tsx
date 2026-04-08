"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { PasswordRequirements } from "@/components/password-requirements"
import { validatePassword } from "@/lib/utils/passwordValidation"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle auth state changes and session setup
  useEffect(() => {
    console.log('Full URL:', window.location.href)
    
    // Check for authorization code or tokens
    const code = searchParams?.get('code')
    let accessToken = searchParams?.get('access_token')
    let refreshToken = searchParams?.get('refresh_token')
    
    // If not found in search params, try URL hash
    if (!accessToken && typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      accessToken = hashParams.get('access_token')
      refreshToken = hashParams.get('refresh_token')
    }
    
    console.log('URL Parameters:', { 
      code: !!code, 
      accessToken: !!accessToken, 
      refreshToken: !!refreshToken
    })

    // Set up auth state listener to detect when session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in automatically, session ready')
        setIsSessionReady(true)
        setError(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Token refreshed, session ready')
        setIsSessionReady(true)
        setError(null)
      }
    })

    // Check current session immediately
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('Existing session found')
        setIsSessionReady(true)
      } else if (code || accessToken) {
        console.log('Waiting for session to be established...')
        // Give some time for automatic session establishment
        setTimeout(async () => {
          const { data: { session: newSession } } = await supabase.auth.getSession()
          if (newSession?.user) {
            console.log('Session established after waiting')
            setIsSessionReady(true)
          } else {
            console.log('No session after waiting')
            setError('El enlace de restablecimiento es inválido o ha expirado. Intenta solicitar uno nuevo.')
          }
        }, 2000)
      } else {
        setError('El enlace de restablecimiento es inválido o ha expirado. Intenta solicitar uno nuevo.')
      }
    }

    checkCurrentSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError("Ambos campos son requeridos")
      return
    }

    const passwordResult = validatePassword(password)
    if (!passwordResult.valid) {
      setError(passwordResult.errors[0])
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    setError(null)

        try {
      // Check if session is ready
      if (!isSessionReady) {
        setError('La sesión no está lista. Intenta nuevamente en unos segundos.')
        return
      }

      // Verify current user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      console.log('Current user check:', { user: !!user, error: getUserError?.message })
      
      if (!user) {
        setError('La sesión ha expirado. Solicita un nuevo enlace de restablecimiento.')
        return
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Password update error:', error)
        setError('Error al actualizar la contraseña. Intenta nuevamente.')
      } else {
        console.log('Password updated successfully')
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-green-600">¡Contraseña Actualizada!</h1>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Tu contraseña ha sido actualizada exitosamente
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Contraseña actualizada</CardTitle>
                    <CardDescription>Serás redirigido al inicio de sesión en unos segundos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Link href="/login" className="text-terracotta hover:underline">
                        Ir al inicio de sesión ahora
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-red-600">Enlace Inválido</h1>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    No se pudo verificar el enlace de restablecimiento
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Error de verificación</CardTitle>
                    <CardDescription>El enlace de restablecimiento no es válido</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-center">
                      <p className="text-sm text-red-500">{error}</p>
                      <p className="text-sm text-muted-foreground">
                        Esto puede ocurrir si:
                      </p>
                      <ul className="text-xs text-muted-foreground text-left space-y-1">
                        <li>• El enlace ha expirado</li>
                        <li>• El enlace ya fue utilizado</li>
                        <li>• El enlace es inválido</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                      <Link href="/recuperar-contrasena" className="text-terracotta hover:underline">
                        Solicitar nuevo enlace de restablecimiento
                      </Link>
                    </div>
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

  // Show loading state while session is being established
  if (!isSessionReady) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Verificando enlace</h1>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Validando tu enlace de restablecimiento...
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Validando enlace</CardTitle>
                    <CardDescription>Por favor espera mientras verificamos tu enlace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Show the password reset form only when session is ready and valid
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Nueva Contraseña</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Crea una nueva contraseña para tu cuenta
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Restablecer contraseña</CardTitle>
                  <CardDescription>Ingresa tu nueva contraseña</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nueva contraseña</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Ingresá tu nueva contraseña"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <PasswordRequirements password={password} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={toggleConfirmPasswordVisibility}
                          aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-terracotta hover:bg-terracotta/90 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        "Actualizar contraseña"
                      )}
                    </Button>
                    {error && (
                      <p className="text-sm text-red-500 text-center">{error}</p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-terracotta">Nueva Contraseña</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Crea una nueva contraseña para tu cuenta
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Restablecer contraseña</CardTitle>
                  <CardDescription>Cargando...</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
} 