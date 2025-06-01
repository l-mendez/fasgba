import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Perfil de usuario en FASGBA',
}

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 