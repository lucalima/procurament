'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, type ReactNode } from 'react'

import type { AppClaims } from '@/lib/auth/claims'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext<AppClaims | null>(null)

const PUBLIC_AUTH_PREFIXES = [
  '/login',
  '/signup',
  '/reset-password',
  '/vendor/invite',
]

function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

/** The signed-in user's JWT claims, or null on public pages. */
export function useAuth() {
  return useContext(AuthContext)
}

/**
 * Supplies the server-verified claims to Client Components and keeps the
 * server-rendered UI in step with Supabase session changes.
 */
export function AuthProvider({
  claims,
  children,
}: {
  claims: AppClaims | null
  children: ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Public auth pages (e.g. password reset) navigate on their own after
      // signing out, so only pull the user off protected pages.
      if (
        event === 'SIGNED_OUT' &&
        !isPublicAuthPath(window.location.pathname)
      ) {
        router.replace('/login')
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return <AuthContext.Provider value={claims}>{children}</AuthContext.Provider>
}
