import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: {
    template: '%s | FASGBA',
    default: 'FASGBA - Federación de Ajedrez del Sur del Gran Buenos Aires',
  },
  description: 'Federación de Ajedrez del Sur del Gran Buenos Aires - Promoviendo el ajedrez en la región sur de Buenos Aires desde 1975',
  generator: 'FASGBA',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
