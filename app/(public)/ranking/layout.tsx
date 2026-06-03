import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ranking',
  description: 'Ranking oficial de jugadores de ajedrez de la Federación del Sur de Buenos Aires',
}

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 