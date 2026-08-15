import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Script from 'next/script'
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
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('[LANDING PAGE] Error fetching profile:', error)
    }
    profile = prof
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 overflow-x-hidden font-sans select-none text-slate-800 flex flex-col justify-between">
      
      {/* 0. AUTHENTICATION ERROR CATCHER */}
      <Script id="auth-error-handler" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const error = params.get('error');
            if (error) {
              if (error.includes('PKCE')) {
                alert('Login Failed: You opened an email link on a different device/browser than the one you requested it from. Please request a new code on this device.');
              } else {
                alert('Authentication Failed: ' + decodeURIComponent(error));
              }
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        `
      }} />

      <div>
        {/* 1. THE LIVE TELEMETRY TICKER */}
        <LiveTicker />

        {/* 2. THE DYNAMIC NAVBAR ROUTING */}
        {user ? (
          <Navbar user={user} profile={profile} />
        ) : (
          /* Beautiful Public Guest Glass Navbar matching structure of standard Navbar */
          <nav className="sticky top-0 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-all duration-300 shadow-sm z-50 select-none">
            <Link href="/" className="flex items-center group">
              <svg className="w-28 sm:w-36 h-6 sm:h-7 text-slate-900" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
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
 
            <div className="flex items-center gap-3.5 sm:gap-6">
              <Link 
                href="/login" 
                className="text-slate-600 hover:text-slate-900 font-bold text-xs tracking-wider uppercase transition-colors duration-150"
              >
                Log In
              </Link>
              <Link 
                href="/login?tab=register" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors"
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

        {/* Expandable FAQ Section */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 tracking-tight">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="group bg-white border border-slate-200 rounded-2xl p-6 open:shadow-md transition-all cursor-pointer">
                <summary className="flex justify-between items-center font-bold text-slate-800 focus:outline-none">
                  How does the AI Mentor work?
                  <span className="transition group-open:rotate-180 text-blue-600">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-slate-500 mt-4 leading-relaxed font-medium">The AI Mentor uses advanced contextual retrieval to analyze your specific course materials, including PDF notes and video transcripts, to provide personalized, citation-backed answers to your doubts instantly.</p>
              </details>
              
              <details className="group bg-white border border-slate-200 rounded-2xl p-6 open:shadow-md transition-all cursor-pointer">
                <summary className="flex justify-between items-center font-bold text-slate-800 focus:outline-none">
                  Can I download the test series offline?
                  <span className="transition group-open:rotate-180 text-blue-600">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-slate-500 mt-4 leading-relaxed font-medium">Yes! Our platform supports Progressive Web App (PWA) capabilities. You can download the app to your device and cache your test papers for offline Computer Based Testing (CBT) environments.</p>
              </details>
              
              <details className="group bg-white border border-slate-200 rounded-2xl p-6 open:shadow-md transition-all cursor-pointer">
                <summary className="flex justify-between items-center font-bold text-slate-800 focus:outline-none">
                  Are the live classes recorded?
                  <span className="transition group-open:rotate-180 text-blue-600">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-slate-500 mt-4 leading-relaxed font-medium">Absolutely. All hybrid batch live sessions are automatically recorded and uploaded to your dashboard vault within 2 hours, complete with auto-generated chapters and searchable transcripts.</p>
              </details>
            </div>
          </div>
        </section>
      </div>

      {/* 5. UNIFIED SYSTEM FOOTER */}
      <Footer />

    </div>
  )
}
