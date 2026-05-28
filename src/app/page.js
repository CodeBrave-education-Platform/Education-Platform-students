import * as React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Sparkles, BookOpen, CheckCircle, Compass, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Initialize Supabase Server Component Client strictly as required
  const supabase = createServerComponentClient({ cookies: () => cookies() })
  
  // Safe Server-Side User check using secure cryptographic validation
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50/30 overflow-x-hidden font-sans select-none text-slate-800">
      
      {/* 1. THE SMART NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo brand */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl font-extrabold tracking-widest uppercase text-slate-900">
              ASENTRA
            </span>
          </Link>

          {/* Dynamic Navigation CTAs */}
          <div className="flex items-center gap-6">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
              >
                Go to Portal →
              </Link>
            ) : (
              <div className="flex items-center gap-6">
                <Link 
                  href="/login" 
                  className="text-slate-700 hover:text-slate-900 font-semibold text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/login?tab=register" 
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. THE HERO SECTION */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
        
        {/* Left Side: Editorial Typography Copy */}
        <section className="w-full lg:w-1/2 flex flex-col items-start text-left space-y-6 lg:space-y-8 relative z-10 animate-fade-in">
          {/* Pill Badge */}
          <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            IIT JEE MAINS • ADVANCED • FOUNDATIONS
          </div>

          {/* Heading H1 */}
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
            Your Future is Being Created Today.
          </h1>

          {/* Subtext description */}
          <p className="text-slate-500 text-base lg:text-lg leading-relaxed max-w-xl font-medium">
            Join India's most advanced learning portal. Premium live classes, structured test series, and dedicated doubt solving.
          </p>

          {/* Dynamic call to action */}
          <div className="pt-2">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:-translate-y-1 transition-all text-lg inline-flex items-center gap-2 group"
              >
                <span>Enter Your Portal</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:-translate-y-1 transition-all text-lg inline-flex items-center gap-2 group"
              >
                <span>Start Learning for Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </section>

        {/* Right Side: The Abstract Visual */}
        <section className="hidden lg:flex w-1/2 relative justify-center">
          
          {/* Two absolute positioned glowing orbs behind the card for a 3D hovering effect */}
          <div className="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl -top-12 -left-12 pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-3xl -bottom-12 -right-12 pointer-events-none" />

          {/* Premium hovering Glass card */}
          <div className="w-[400px] h-[500px] bg-white/40 backdrop-blur-3xl border border-white rounded-[3rem] shadow-2xl relative z-10 flex flex-col items-center justify-between p-10 hover:-translate-y-1 transition-transform duration-500">
            
            {/* Logo header inside card */}
            <div className="flex items-center gap-2 self-start select-none">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                A
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-800 uppercase">ASENTRA ACADEMY</span>
            </div>

            {/* Glowing sparkles emblem in the dead center */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 shadow-md shadow-slate-100 flex items-center justify-center text-blue-500 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Elevated Preparation</h3>
                <p className="text-[11px] text-slate-400 font-semibold max-w-[200px]">Unlock structured foundation modules and test ledgers</p>
              </div>
            </div>

            {/* Bullet points summarizing success in bottom of glass card */}
            <div className="w-full space-y-2 border-t border-slate-200/50 pt-6">
              {[
                { label: 'Interactive live curriculums', icon: BookOpen },
                { label: 'Verified faculty checkouts', icon: CheckCircle },
                { label: 'Premium IIT JEE foundations', icon: Compass }
              ].map((item, idx) => {
                const IconComponent = item.icon
                return (
                  <div key={idx} className="flex items-center gap-2.5 text-[10.5px] font-semibold text-slate-600">
                    <IconComponent className="w-4 h-4 text-blue-500/80 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>

          </div>

        </section>

      </main>

    </div>
  )
}
