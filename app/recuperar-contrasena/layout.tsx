import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recuperar Contraseña | FASGBA",
  description: "Recupera tu contraseña de FASGBA",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 