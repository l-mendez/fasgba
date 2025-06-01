import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Cursos y capacitaciones de ajedrez ofrecidos por FASGBA',
}

export default function CursosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 