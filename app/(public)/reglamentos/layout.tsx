import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reglamentos',
  description: 'Reglamentos oficiales y normativas de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function ReglamentosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 