import type { Metadata } from 'next'
import './globals.css'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | FASGBA',
    default: 'FASGBA - Federación de Ajedrez del Sur del Gran Buenos Aires',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    title: 'FASGBA - Federación de Ajedrez del Sur del Gran Buenos Aires',
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // Search Console / Bing Webmaster verification tokens (meta-tag method).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
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
    <html lang="es-AR" suppressHydrationWarning>
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
