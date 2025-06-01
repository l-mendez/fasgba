import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jugadores',
  description: 'Directorio de jugadores de ajedrez federados en la región sur de Buenos Aires',
}

export default function JugadoresLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 