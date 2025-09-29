import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Últimas noticias y eventos de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function NoticiasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 