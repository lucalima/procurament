import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

import { AuthProvider } from '@/components/providers/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { readAppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import './globals.css'

const calSans = localFont({
  src: '../../public/fonts/CalSans-SemiBold.woff2',
  weight: '600',
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ProcureMaster',
  description: 'AI procurement intelligence platform',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = readAppClaims(data?.claims)

  return (
    <html
      lang="en"
      className={cn(calSans.variable, inter.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Content Guidelines §6.8: top-right, max 3 stacked, close on hover.
              Rendered before the page so it subscribes before page effects
              fire toasts on load. */}
          <Toaster position="top-right" visibleToasts={3} closeButton />
          <QueryProvider>
            <AuthProvider claims={claims}>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
