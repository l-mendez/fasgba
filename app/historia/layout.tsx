import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historia',
  description: 'Historia de la Federación de Ajedrez del Sur de Buenos Aires desde 1985',
}

export default function HistoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 