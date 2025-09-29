import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clubes Afiliados',
  description: 'Conoce los clubes que forman parte de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function ClubesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 