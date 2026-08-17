import { createBrowserClient } from '@supabase/ssr'

export function createClient() {


  const cookieOptions = {
    path: '/',
    sameSite: 'lax'
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.endsWith('institute.com') || hostname.includes('institute.com')) {
      cookieOptions.domain = '.institute.com'
    }
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )

  // Wrap auth.getUser and auth.getSession with graceful network error catchers
  const originalGetUser = client.auth.getUser.bind(client.auth)
  client.auth.getUser = async (...args) => {
    try {
      return await originalGetUser(...args)
    } catch (err) {
      console.error('[Supabase Auth Fetch Error]', err)
      return { data: { user: null }, error: err }
    }
  }

  return client
}
