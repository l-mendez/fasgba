import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registro',
  description: 'Regístrate en FASGBA - Federación de Ajedrez del Sur de Buenos Aires',
}

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 