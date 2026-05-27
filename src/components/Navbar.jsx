'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, User, LogOut, Loader2, Monitor, Sun, Moon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

export default function Navbar({ user, profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dropdownRef = useRef(null)

  // Toggle state
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return null
  }

  const displayName = profile?.full_name || user.email.split('@')[0]
  const displayRole = profile?.role || 'student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoggingOut(false)
      setIsDropdownOpen(false)
    }
  }

  return (
    <nav className="relative w-full border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-6 py-3 flex items-center justify-between transition-all duration-300 shadow-sm z-50 select-none">
      <Link href="/" className="flex flex-col items-start group">
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
          <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          
          {/* Custom drawn geometric letter 'A' with RED accented leg */}
          <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
          {/* Red accent leg matching logo image */}
          <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
        </svg>
      </Link>

      <div className="flex items-center gap-4 relative">
        {/* Interactive User profile pill capsule matching image 2 (without hard borders) */}
        <div ref={dropdownRef} className="relative">
          <button 
            type="button"
            onClick={toggleDropdown}
            className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/80 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 px-4 py-2 rounded-full cursor-pointer select-none transition-all outline-none border-none shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shrink-0">
              {displayInitials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 leading-none">
                {displayRole}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive dropdown menu option list */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl py-2 z-50 border border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-850">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Account</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-250 truncate mt-0.5">{user.email}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer transition-colors border-none bg-transparent"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile Info</span>
              </Link>

              {/* Theme togglers inline */}
              <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-850 mt-1.5 pt-2">
                <span>Theme Mode</span>
                <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setTheme('light')} 
                    className={`p-1.5 rounded-md cursor-pointer ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setTheme('dark')} 
                    className={`p-1.5 rounded-md cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-850 my-1" />

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors border-none bg-transparent disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                ) : (
                  <LogOut className="w-4 h-4 text-rose-500" />
                )}
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
