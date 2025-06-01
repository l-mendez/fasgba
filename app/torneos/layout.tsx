import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Torneos',
  description: 'Próximos torneos y competencias de ajedrez organizados por FASGBA',
}

export default function TorneosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 