import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function ConfirmEmailPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-terracotta" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Confirma tu email
          </h1>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un correo electrónico con un enlace para confirmar tu cuenta.
            Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button
            asChild
            className="w-full bg-terracotta hover:bg-terracotta/90 text-white"
          >
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 