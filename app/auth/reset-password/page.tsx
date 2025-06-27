"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle the password reset on component mount
  useEffect(() => {
    const handlePasswordReset = async () => {
      // Check for authorization code (modern Supabase approach)
      const code = searchParams?.get('code')
      
      // Try to get direct tokens (legacy approach)
      let accessToken = searchParams?.get('access_token')
      let refreshToken = searchParams?.get('refresh_token')
      let type = searchParams?.get('type')
      
      // If not found in search params, try to get from URL hash
      if (!accessToken && typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        accessToken = hashParams.get('access_token')
        refreshToken = hashParams.get('refresh_token')
        type = hashParams.get('type')
        
        console.log('Hash Parameters:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })
      }
      
      console.log('URL Parameters:', { 
        code: !!code, 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken, 
        type 
      })
      console.log('Full URL:', window.location.href)
      
      // Handle authorization code flow (modern approach)
      if (code) {
        try {
          console.log('Using authorization code flow')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          console.log('Code exchange result:', { user: !!data?.user, error: error?.message })
          
          if (error) {
            console.error('Code exchange error:', error)
            setError('El enlace de restablecimiento es inválido o ha expirado')
          } else if (data?.user) {
            console.log('Session established successfully via code exchange')
            // Session is now established, user can proceed to reset password
          }
        } catch (err) {
          console.error('Code exchange failed:', err)
          setError('Error al procesar el enlace de restablecimiento')
        }
      }
      // Handle direct token flow (legacy approach)
      else if (accessToken && refreshToken) {
        try {
          console.log('Using direct token flow')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          console.log('Session setup result:', { user: !!data?.user, error: error?.message })
          
          // More forgiving error handling - only show error for critical failures
          if (error && error.message.includes('expired') && !data?.user) {
            setError('El enlace de restablecimiento es inválido o ha expirado')
          } else if (error && !data?.user) {
            console.error('Session error:', error)
            // Don't set error immediately, let user try to proceed
          }
        } catch (err) {
          console.error('Session setup failed:', err)
          setError('Error al procesar el enlace de restablecimiento')
        }
      } else {
        console.log('Missing both authorization code and direct tokens')
        setError('El enlace de restablecimiento es inválido o ha expirado')
      }
    }

    handlePasswordReset()
  }, [searchParams, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError("Ambos campos son requeridos")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, try to get the current user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      console.log('Current user check:', { user: !!user, error: getUserError?.message })
      
             // If no user, try to set session again with URL params
       if (!user) {
         let accessToken = searchParams?.get('access_token')
         let refreshToken = searchParams?.get('refresh_token')
         
         // Also check hash parameters
         if (!accessToken && typeof window !== 'undefined') {
           const hashParams = new URLSearchParams(window.location.hash.substring(1))
           accessToken = hashParams.get('access_token')
           refreshToken = hashParams.get('refresh_token')
         }
         
         if (accessToken && refreshToken) {
           console.log('Retrying session setup before password update')
           const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
             access_token: accessToken,
             refresh_token: refreshToken,
           })
           
           if (!sessionData?.user) {
             setError('El enlace de restablecimiento es inválido o ha expirado')
             return
           }
         } else {
           setError('El enlace de restablecimiento es inválido o ha expirado')
           return
         }
       }

      // Now try to update the password
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
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
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