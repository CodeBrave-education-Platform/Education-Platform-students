import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import LiveTicker from '@/components/landing/LiveTicker'
import HeroInteractive from '@/components/landing/HeroInteractive'
import FeatureScroll from '@/components/landing/FeatureScroll'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  
  // Safe Server-Side User session check
  const { data: { user } } = await supabase.auth.getUser()

  // Retrieve user profile if session exists
  let profile = null
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = prof
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans select-none text-slate-800 flex flex-col justify-between">
      
      <div>
        {/* 1. THE LIVE TELEMETRY TICKER */}
        <LiveTicker />

        {/* 2. THE DYNAMIC NAVBAR ROUTING */}
        {user ? (
          <Navbar user={user} profile={profile} />
        ) : (
          /* Beautiful Public Guest Glass Navbar matching structure of standard Navbar */
          <nav className="sticky top-0 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between transition-all duration-300 shadow-sm z-50 select-none">
            <Link href="/" className="flex items-center group">
              <svg className="w-36 h-7 text-slate-900" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Geometric letter 'A' */}
                <path d="M12 44 L28 10 L44 44" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 32 L36 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                
                {/* Geometric letter 'S' */}
                <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Geometric letter 'E' */}
                <path d="M110 12 L92 12 L92 42 L110 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M92 27 L106 27" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                
                {/* Geometric letter 'N' */}
                <path d="M122 42 L122 12 L142 42 L142 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Geometric letter 'T' */}
                <path d="M152 12 L178 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M165 12 L165 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                
                {/* Geometric letter 'R' */}
                <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26 L188 26" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Geometric letter 'A' with RED accented leg */}
                <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Red accent leg matching logo image */}
                <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </Link>

            <div className="flex items-center gap-6">
              <Link 
                href="/login" 
                className="text-slate-600 hover:text-slate-900 font-bold text-xs tracking-wider uppercase transition-colors duration-150"
              >
                Log In
              </Link>
              <Link 
                href="/login?tab=register" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
              >
                Register
              </Link>
            </div>
          </nav>
        )}

        {/* 3. THE HIGH-FIDELITY HERO VAULT */}
        <HeroInteractive user={user} />

        {/* 4. SCROLL-TRIGGERED TOURS */}
        <FeatureScroll />
      </div>

      {/* 5. UNIFIED SYSTEM FOOTER */}
      <Footer />

    </div>
  )
}
