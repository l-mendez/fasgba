import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arbitraje',
  description: 'Información sobre arbitraje de ajedrez y certificaciones en FASGBA',
}

export default function ArbitrajeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 