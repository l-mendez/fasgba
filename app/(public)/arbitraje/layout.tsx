import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Árbitros de ajedrez',
  description: 'Árbitros oficiales de ajedrez de FASGBA, la Federación de Ajedrez del Sur del Gran Buenos Aires.',
  path: '/arbitraje',
})

export default function ArbitrajeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
