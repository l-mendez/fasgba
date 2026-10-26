"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { PasswordRequirements } from "@/components/password-requirements"
import { validatePassword } from "@/lib/utils/passwordValidation"
import { AuthShell, authLinkClass } from "@/app/auth/components/auth-shell"
import { PasswordInput } from "@/app/auth/components/password-input"

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle auth state changes and session setup
  useEffect(() => {
    // Check for authorization code or tokens
    const code = searchParams?.get('code')
    let accessToken = searchParams?.get('access_token')
    
    // If not found in search params, try URL hash
    if (!accessToken && typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      accessToken = hashParams.get('access_token')
    }

    // Set up auth state listener to detect when session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsSessionReady(true)
        setError(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setIsSessionReady(true)
        setError(null)
      }
    })

    // Check current session immediately
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setIsSessionReady(true)
      } else if (code || accessToken) {
        // Give some time for automatic session establishment
        setTimeout(async () => {
          const { data: { session: newSession } } = await supabase.auth.getSession()
          if (newSession?.user) {
            setIsSessionReady(true)
          } else {
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
      const { data: { user } } = await supabase.auth.getUser()
      
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

  if (success) {
    return (
      <AuthShell
        title="Contraseña actualizada"
        links={
          <p>
            <Link href="/login" className={authLinkClass}>
              Iniciar sesión
            </Link>
          </p>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Te redirigiremos al inicio de sesión en unos segundos.
        </p>
      </AuthShell>
    )
  }

  // Link verification failed (form validation errors are shown inline below)
  if (error && !isSessionReady) {
    return (
      <AuthShell
        title="Enlace inválido"
        links={
          <>
            <p>
              <Link href="/recuperar-contrasena" className={authLinkClass}>
                Solicitar un nuevo enlace
              </Link>
            </p>
            <p>
              <Link href="/login" className={authLinkClass}>
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        }
      >
        <p className="text-center text-sm text-destructive">{error}</p>
      </AuthShell>
    )
  }

  // Show loading state while session is being established
  if (!isSessionReady) {
    return <ResetPasswordFallback />
  }

  // Show the password reset form only when session is ready and valid
  return (
    <AuthShell title="Nueva contraseña">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-terracotta text-white hover:bg-terracotta/90"
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
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </form>
    </AuthShell>
  )
}

function ResetPasswordFallback() {
  return (
    <AuthShell title="Nueva contraseña">
      <div className="flex justify-center py-6" role="status" aria-label="Verificando enlace">
        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
      </div>
    </AuthShell>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
