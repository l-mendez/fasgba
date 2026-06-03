import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historia',
  description: 'Historia de la Federación de Ajedrez del Sur del Gran Buenos Aires desde 1975',
}

export default function HistoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 