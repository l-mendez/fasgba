import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arbitraje',
  description: 'Listado de árbitros oficiales de ajedrez en FASGBA',
}

export default function ArbitrajeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
