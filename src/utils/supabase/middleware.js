import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Intercept Supabase OAuth IP fallback redirects (where Supabase ignores redirectTo and sends code to '/')
  const currentPath = request.nextUrl.pathname
  if (currentPath === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Prevent server-side crash if environment variables are missing or are placeholders
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id") ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key")
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const host = request.headers.get('host') || ''
          const cookieDomain = (host.endsWith('institute.com') || host.includes('institute.com')) ? '.institute.com' : undefined

          cookiesToSet.forEach(({ name, value, options }) => {
            const updatedOptions = { path: '/', sameSite: 'lax', ...options }
            if (cookieDomain) {
              updatedOptions.domain = cookieDomain
            }
            request.cookies.set(name, value, updatedOptions)
          })

          // Synchronize the cookie header so downstream Server Components see the refreshed session!
          // We DO NOT use encodeURIComponent because Next.js/Supabase already manages URL encoding.
          const newCookieHeader = request.cookies
            .getAll()
            .map(c => `${c.name}=${c.value}`)
            .join('; ')
          request.headers.set('cookie', newCookieHeader)

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            const updatedOptions = { path: '/', sameSite: 'lax', ...options }
            if (cookieDomain) {
              updatedOptions.domain = cookieDomain
            }
            supabaseResponse.cookies.set(name, value, updatedOptions)
          })
        },
      },
    }
  )

  // IMPORTANT: Do NOT write any logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[MIDDLEWARE DEBUG] User:', user ? user.id : 'null')
  console.log('[MIDDLEWARE DEBUG] All cookies:', request.cookies.getAll().map(c => c.name))

  // Route Protection Rules
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/learn') || 
    pathname.startsWith('/books') || 
    pathname.startsWith('/test-series') ||
    pathname.startsWith('/checkout')
    
  const isLoginRoute = pathname.startsWith('/login')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
