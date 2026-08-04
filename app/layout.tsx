import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'

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
          <AuthProvider>
            {children}
            {/* Both toast systems are in use: `useToast` (Radix) and `toast()` from sonner. */}
            <ShadcnToaster />
            <SonnerToaster />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
