import * as React from 'react'
import { GraduationCap } from 'lucide-react'
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
      <div className="flex items-center gap-2 font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-pink-500 bg-clip-text text-transparent select-none">
        <GraduationCap className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400" />
        <span>EduPortal</span>
      </div>

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
