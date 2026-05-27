import * as React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from './ThemeToggle'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/40 dark:border-zinc-800/40 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl px-6 py-3 flex items-center justify-between transition-all duration-300">
      <Link href="/" className="flex flex-col items-start select-none group">
        <svg className="w-36 h-7" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Custom drawn geometric letter 'A' */}
          <path d="M12 44 L28 10 L44 44" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          <path d="M20 32 L36 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'S' */}
          <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'E' */}
          <path d="M110 12 L92 12 L92 42 L110 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          <path d="M92 27 L106 27" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'N' */}
          <path d="M122 42 L122 12 L142 42 L142 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'T' */}
          <path d="M152 12 L178 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          <path d="M165 12 L165 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'R' */}
          <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26 L188 26" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'A' with RED accented leg */}
          <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          {/* Red accent leg matching logo image */}
          <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
        </svg>
      </Link>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Welcome, <span className="text-indigo-500 dark:text-indigo-400 font-bold">{user.email}</span>
        </span>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </nav>
  )
}
