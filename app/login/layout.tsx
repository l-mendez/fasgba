import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta de FASGBA - Federación de Ajedrez del Sur de Buenos Aires',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 