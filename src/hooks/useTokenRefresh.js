import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useTokenRefresh() {
  useEffect(() => {
    const supabase = createClient()
    if (!supabase || !supabase.auth) return

    console.log('[Token Refresh Hook] Initialized session observer.')

    // 1. Listen for TOKEN_REFRESHED event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Token Refresh Hook] Token refreshed successfully:', session ? 'Session active' : 'No session')
      }
    })

    // 2. Proactive check & refresh function
    const checkAndRefresh = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[Token Refresh Hook] Error retrieving session:', error)
          return
        }

        if (session && session.expires_at) {
          const expiresAtMs = session.expires_at * 1000
          const nowMs = Date.now()
          const timeRemainingMs = expiresAtMs - nowMs
          const fifteenMinutesMs = 15 * 60 * 1000

          console.log(`[Token Refresh Hook] Session expires in ${Math.round(timeRemainingMs / 1000 / 60)} minutes.`)

          // If token expires in less than 15 minutes, refresh proactively
          if (timeRemainingMs < fifteenMinutesMs) {
            console.log('[Token Refresh Hook] Token expires in less than 15 minutes. Invoking auth.refreshSession()...')
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('[Token Refresh Hook] Proactive token refresh failed:', refreshError)
            } else {
              console.log('[Token Refresh Hook] Proactive token refresh succeeded.')
            }
          }
        }
      } catch (err) {
        console.error('[Token Refresh Hook] Unexpected error checking token refresh status:', err)
      }
    }

    // Run check immediately on mount
    checkAndRefresh()

    // 45 minutes check interval (45 * 60 * 1000 ms)
    const intervalId = setInterval(checkAndRefresh, 45 * 60 * 1000)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
      clearInterval(intervalId)
      console.log('[Token Refresh Hook] Cleared session observer interval.')
    }
  }, [])
}
