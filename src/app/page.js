'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, AlertCircle } from 'lucide-react'

export default function Home() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState('')

  // Simulate loading delay (Linear Standard Pre-loader)
  useEffect(() => {
    document.title = "Asentra | Welcome"
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  // Google OAuth Auth Hook
  const handleGoogleLogin = async () => {
    setIsAuthenticating(true)
    setError('')
    try {
      // Validate configuration dynamically
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error("Missing Supabase Environment Configuration.");
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (oauthError) throw oauthError
    } catch (err) {
      console.error("Google OAuth error:", err)
      setError(err.message || "Failed to connect with Google OAuth. Please try again.")
    } finally {
      setIsAuthenticating(false)
    }
  }

  // 1. Pre-loader view
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-3xl font-bold tracking-tighter text-slate-900 animate-pulse select-none font-sans">
          Asentra
        </span>
      </div>
    )
  }

  // 2. Main Premium view
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-white flex items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* Premium Glassmorphic Card Container */}
      <div className="w-full max-w-5xl bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-all duration-300">
        
        {/* Left Section: Form & Branding */}
        <section className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          
          <div className="my-auto space-y-8">
            {/* Minimalist Top Logo mark */}
            <div className="flex items-center gap-2 select-none">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-blue-500/20">
                A
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900">Asentra</span>
            </div>

            {/* Typography Header */}
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
                Welcome to Asentra
              </h1>
              <p className="text-sm text-slate-500 tracking-wide font-normal leading-relaxed">
                Sign in to access your premium learning portal
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex gap-2 items-start p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Perfectly Centered Google Button with Dynamic Loader */}
            <div className="pt-2">
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-medium py-3.5 rounded-xl shadow-sm hover:shadow-md hover:bg-blue-50/50 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none cursor-pointer transition-all duration-200 ease-out text-sm"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.96 3.07C6.42 7.51 9 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                      <path fill="#FBBC05" d="M5.46 10.57c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 2.92C.54 4.84 0 7.02 0 9.28s.54 4.44 1.5 6.36l3.96-3.07z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3 0-5.58-2.47-6.54-5.53L1.5 15.84C3.39 20.35 7.35 23 12 23z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Minimalist Footer Statement */}
          <footer className="text-center w-full mt-auto pt-10">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase select-none">
              Your future is being created today.
            </span>
          </footer>

        </section>

        {/* Right Section: Abstract glowing design */}
        <section className="hidden md:flex w-1/2 relative bg-slate-50/50 items-center justify-center overflow-hidden border-l border-slate-100 select-none">
          
          {/* Abstract glowing orb blur-3xl */}
          <div className="absolute w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -top-10 -right-10 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl bottom-10 -left-10 pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
          
          {/* Muted centered brand watermark */}
          <div className="relative z-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100/80 shadow-md shadow-slate-100 flex items-center justify-center text-slate-400">
              <Sparkles className="w-5 h-5 text-blue-500/60" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-450 dark:text-slate-400 font-sans">
              Asentra
            </span>
          </div>

        </section>

      </div>
    </main>
  )
}
