import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging OAuth code for session:', error.message)
      // Redirect back home with error message
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  // Redirect to dashboard on successful authentication
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
