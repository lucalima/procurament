import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { homePathFor, readAppClaims } from '@/lib/auth/claims'
import type { Database } from '@/types/database'

/** Routes anyone can open (App Flow §1, §3). */
const PUBLIC_PATHS = ['/login', '/signup']
const PUBLIC_PREFIXES = ['/reset-password', '/vendor/invite']

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verifies the session (refreshing it if needed) and returns the JWT claims.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const claims = readAppClaims(data?.claims)
  const { pathname, search } = request.nextUrl

  // Redirects must carry any refreshed session cookies.
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  // API routes enforce their own auth and return JSON errors.
  if (matches(pathname, '/api')) return response

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => matches(pathname, p))

  if (isPublic) {
    // Signed-in users skip the login and signup pages. Password reset and
    // invite links stay reachable because they create their own session.
    if (claims && PUBLIC_PATHS.includes(pathname)) {
      return redirectTo(homePathFor(claims))
    }
    return response
  }

  if (!claims) {
    // A session without hook claims means a deactivated account.
    if (signedIn) {
      await supabase.auth.signOut()
      return redirectTo('/login?error=disabled')
    }
    if (pathname === '/') return redirectTo('/login')
    // Keep the destination so email deep links land after sign-in (App Flow §6).
    const next = encodeURIComponent(`${pathname}${search}`)
    return redirectTo(`/login?next=${next}`)
  }

  if (pathname === '/') return redirectTo(homePathFor(claims))

  // Vendors live only under /vendor; internal users never enter it.
  const inVendorArea = matches(pathname, '/vendor')
  if (claims.userType === 'vendor' && !inVendorArea)
    return redirectTo('/vendor')
  if (claims.userType === 'internal' && inVendorArea) {
    return redirectTo('/dashboard')
  }

  // Onboarding wizard: first-login PMs only, and only until it is complete.
  if (claims.userType === 'internal') {
    const onOnboarding = matches(pathname, '/onboarding')
    if (claims.role !== 'procurement_manager') {
      if (onOnboarding) return redirectTo('/dashboard')
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', claims.userId)
        .single()
      const complete = profile?.onboarding_complete ?? false
      if (!complete && !onOnboarding) return redirectTo('/onboarding')
      if (complete && onOnboarding) return redirectTo('/dashboard')
    }
  }

  return response
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
