"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { AuthShell, authLinkClass } from "@/app/auth/components/auth-shell"

type ResendStatus = "idle" | "sending" | "sent" | "error"

const noopSubscribe = () => () => {}

export default function ConfirmEmailPage() {
  // Set by the signup form; only the email is stored, never the password.
  const email = useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem("signupEmail"),
    () => null
  )
  const [status, setStatus] = useState<ResendStatus>("idle")

  const resend = async () => {
    if (!email) return
    setStatus("sending")
    const { error } = await createClient().auth.resend({ type: "signup", email })
    setStatus(error ? "error" : "sent")
  }

  return (
    <AuthShell
      title="Confirma tu email"
      links={
        <p>
          ¿Ya confirmaste?{" "}
          <Link href="/login" className={authLinkClass}>
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <div className="space-y-4 text-center">
        <Mail className="mx-auto h-10 w-10 text-amber" />
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada.
        </p>
        {email && (
          <Button
            variant="outline"
            onClick={resend}
            disabled={status === "sending" || status === "sent"}
            className="w-full"
          >
            {status === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "sent" ? "Email reenviado" : "Reenviar email"}
          </Button>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">No se pudo reenviar. Intenta en unos minutos.</p>
        )}
      </div>
    </AuthShell>
  )
}
